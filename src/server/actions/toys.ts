"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { emitLog } from "@/instrumentation";
import { ActionResult, ActionResultWithData, parseInput } from "@/lib/actionResult";
import { BOOK_STATUS_TYPE } from "@/lib/orderOptions";
import { MAX_ID, MAX_MONEY, MAX_NAME, MAX_STOCK } from "@/lib/limits";

const toySchema = z.object({
  title: z.string().trim().min(1).max(MAX_NAME),
  info: z.string().trim().max(5000).optional(),
  image: z.string().trim().max(2000).optional(),
  price: z.number().int().min(0).max(MAX_MONEY),
  stock: z.number().int().min(0).max(MAX_STOCK),
  status: z.enum(BOOK_STATUS_TYPE).default("READY_STOCK"),
});

function toyData(data: z.infer<typeof toySchema>) {
  return {
    title: data.title,
    info: orNull(data.info),
    image: orNull(data.image),
    price: data.price,
    stock: data.stock,
    status: data.status,
  };
}

function orNull(v: string | undefined | null): string | null {
  const t = v?.trim();
  return t ? t : null;
}

async function ensureUniqueTitle(title: string, excludeId?: string): Promise<string | null> {
  const existing = await db.toy.findUnique({ where: { title } });
  if (existing && existing.id !== excludeId) {
    return "Judul mainan sudah digunakan, gunakan judul lain.";
  }
  return null;
}

export async function createToy(
  input: z.infer<typeof toySchema>
): Promise<ActionResultWithData<{ id: string }>> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const parsed = parseInput(toySchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  const dupError = await ensureUniqueTitle(data.title);
  if (dupError) return { ok: false, error: dupError };

  try {
    const toy = await db.toy.create({ data: toyData(data) });
    revalidateTag("toys", "max");
    revalidatePath("/admin/toys");
    emitLog(`Toy "${toy.title}" created`, { actor, toy_id: toy.id, title: toy.title });
    return { ok: true, data: { id: toy.id } };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      emitLog(`Toy "${data.title}" save failed: duplicate title`, { actor, title: data.title }, SeverityNumber.WARN);
      return { ok: false, error: "Judul mainan sudah digunakan, gunakan judul lain." };
    }
    emitLog(`Toy "${data.title}" save failed`, { actor, title: data.title, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
}

export async function updateToy(
  id: string,
  input: z.infer<typeof toySchema>
): Promise<ActionResultWithData<{ id: string }>> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const parsed = parseInput(toySchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  const dupError = await ensureUniqueTitle(data.title, id);
  if (dupError) return { ok: false, error: dupError };

  try {
    const toy = await db.toy.update({ where: { id }, data: toyData(data) });
    revalidateTag("toys", "max");
    revalidatePath("/admin/toys");
    emitLog(`Toy "${toy.title}" updated`, { actor, toy_id: toy.id, title: toy.title });
    return { ok: true, data: { id: toy.id } };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      emitLog(`Toy "${data.title}" update failed: duplicate title`, { actor, toy_id: id, title: data.title }, SeverityNumber.WARN);
      return { ok: false, error: "Judul mainan sudah digunakan, gunakan judul lain." };
    }
    emitLog(`Toy "${data.title}" update failed`, { actor, toy_id: id, title: data.title, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
}

export async function deleteToy(id: string) {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const toy = await db.toy.findUnique({ where: { id }, select: { title: true } });
  try {
    await db.toy.delete({ where: { id } });
  } catch (e) {
    emitLog(`Toy "${toy?.title ?? id}" delete failed`, { actor, toy_id: id, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
  revalidateTag("toys", "max");
  revalidatePath("/admin/toys");
  emitLog(`Toy "${toy?.title ?? id}" deleted`, { actor, toy_id: id });
}

const toyBatchPriceSchema = z.object({
  toyId: z.string().min(1).max(MAX_ID),
  entries: z.array(
    z.object({
      batchId: z.string().min(1).max(MAX_ID),
      price: z.number().int().min(0).max(MAX_MONEY),
    })
  ),
});

export async function setToyBatchPrices(
  input: z.infer<typeof toyBatchPriceSchema>
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = parseInput(toyBatchPriceSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;

  await db.$transaction(async (tx) => {
    await tx.toyBatchPrice.deleteMany({ where: { toyId: data.toyId } });
    if (data.entries.length > 0) {
      await tx.toyBatchPrice.createMany({
        data: data.entries.map((e) => ({
          toyId: data.toyId,
          batchId: e.batchId,
          price: e.price,
        })),
      });
    }
  });

  revalidatePath("/admin/toys");
  return { ok: true };
}