"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, type Toy } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { ActionResultWithData } from "@/lib/actionResult";
import { BOOK_STATUS_TYPE } from "@/lib/orderOptions";

const toySchema = z.object({
  title: z.string().trim().min(1),
  publisher: z.string().trim().max(500).optional(),
  info: z.string().trim().max(5000).optional(),
  image: z.string().trim().max(2000).optional(),
  price: z.number().int().min(0),
  stock: z.number().int().min(0),
  status: z.enum(BOOK_STATUS_TYPE).default("READY_STOCK"),
});

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
): Promise<ActionResultWithData<Toy>> {
  await requireAdmin();

  const data = toySchema.parse(input);
  const dupError = await ensureUniqueTitle(data.title);
  if (dupError) return { ok: false, error: dupError };

  try {
    const toy = await db.toy.create({
      data: {
        title: data.title,
        publisher: orNull(data.publisher),
        info: orNull(data.info),
        image: orNull(data.image),
        price: data.price,
        stock: data.stock,
        status: data.status,
      },
    });
    revalidatePath("/admin/toys");
    return { ok: true, data: toy };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Judul mainan sudah digunakan, gunakan judul lain." };
    }
    throw e;
  }
}

export async function updateToy(
  id: string,
  input: z.infer<typeof toySchema>
): Promise<ActionResultWithData<Toy>> {
  await requireAdmin();

  const data = toySchema.parse(input);
  const dupError = await ensureUniqueTitle(data.title, id);
  if (dupError) return { ok: false, error: dupError };

  try {
    const toy = await db.toy.update({
      where: { id },
      data: {
        title: data.title,
        publisher: orNull(data.publisher),
        info: orNull(data.info),
        image: orNull(data.image),
        price: data.price,
        stock: data.stock,
        status: data.status,
      },
    });
    revalidatePath("/admin/toys");
    return { ok: true, data: toy };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Judul mainan sudah digunakan, gunakan judul lain." };
    }
    throw e;
  }
}

export async function deleteToy(id: string) {
  await requireAdmin();

  await db.toy.delete({ where: { id } });
  revalidatePath("/admin/toys");
}

const toyBatchPriceSchema = z.object({
  toyId: z.string().min(1),
  entries: z.array(
    z.object({
      batchId: z.string().min(1),
      price: z.number().int().min(0),
    })
  ),
});

export async function setToyBatchPrices(input: z.infer<typeof toyBatchPriceSchema>) {
  await requireAdmin();

  const data = toyBatchPriceSchema.parse(input);

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
}