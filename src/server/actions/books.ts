"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { Prisma, type Book } from "@prisma/client";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { emitLog } from "@/instrumentation";
import { ActionResult, ActionResultWithData } from "@/lib/actionResult";
import { FORMAT_TYPE, BOOK_STATUS_TYPE } from "@/lib/orderOptions";

const bookSchema = z.object({
  title: z.string().trim().min(1),
  publisher: z.string().trim().max(500).optional(),
  info: z.string().trim().max(5000).optional(),
  image: z.string().trim().max(2000).optional(),
  price: z.number().int().min(0),
  stock: z.number().int().min(0),
  status: z.enum(BOOK_STATUS_TYPE).default("READY_STOCK"),
  formats: z.array(z.enum(FORMAT_TYPE)).default([]),
});

function orNull(v: string | undefined | null): string | null {
  const t = v?.trim();
  return t ? t : null;
}

function bookData(data: z.infer<typeof bookSchema>) {
  return {
    title: data.title,
    publisher: orNull(data.publisher),
    info: orNull(data.info),
    image: orNull(data.image),
    price: data.price,
    stock: data.stock,
    status: data.status,
    formats: data.formats,
  };
}

async function ensureUniqueTitle(title: string, excludeId?: string): Promise<string | null> {
  const existing = await db.book.findUnique({ where: { title } });
  if (existing && existing.id !== excludeId) {
    return "Judul buku sudah digunakan, gunakan judul lain.";
  }
  return null;
}

export async function createBook(
  input: z.infer<typeof bookSchema>
): Promise<ActionResultWithData<Book>> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const data = bookSchema.parse(input);
  const dupError = await ensureUniqueTitle(data.title);
  if (dupError) return { ok: false, error: dupError };

  try {
    const book = await db.book.create({ data: bookData(data) });
    revalidateTag("books", "max");
    revalidatePath("/admin/books");
    emitLog(`Book "${book.title}" created`, { actor, book_id: book.id, title: book.title });
    return { ok: true, data: book };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      emitLog(`Book "${data.title}" save failed: duplicate title`, { actor, title: data.title }, SeverityNumber.WARN);
      return { ok: false, error: "Judul buku sudah digunakan, gunakan judul lain." };
    }
    emitLog(`Book "${data.title}" save failed`, { actor, title: data.title, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
}

export async function updateBook(
  id: string,
  input: z.infer<typeof bookSchema>
): Promise<ActionResultWithData<Book>> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const data = bookSchema.parse(input);
  const dupError = await ensureUniqueTitle(data.title, id);
  if (dupError) return { ok: false, error: dupError };

  try {
    const book = await db.book.update({ where: { id }, data: bookData(data) });
    revalidateTag("books", "max");
    revalidatePath("/admin/books");
    emitLog(`Book "${book.title}" updated`, { actor, book_id: book.id, title: book.title });
    return { ok: true, data: book };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      emitLog(`Book "${data.title}" update failed: duplicate title`, { actor, book_id: id, title: data.title }, SeverityNumber.WARN);
      return { ok: false, error: "Judul buku sudah digunakan, gunakan judul lain." };
    }
    emitLog(`Book "${data.title}" update failed`, { actor, book_id: id, title: data.title, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
}

export async function deleteBook(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const book = await db.book.findUnique({ where: { id }, select: { title: true } });
  const sold = await db.orderItem.count({ where: { bookId: id } });
  if (sold > 0) {
    return { ok: false, error: "Buku ini sudah pernah terjual dan tidak bisa dihapus." };
  }

  try {
    await db.book.delete({ where: { id } });
  } catch (e) {
    emitLog(`Book "${book?.title ?? id}" delete failed`, { actor, book_id: id, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
  revalidateTag("books", "max");
  revalidateTag("bookBatchPrices", "max");
  revalidatePath("/admin/books");
  emitLog(`Book "${book?.title ?? id}" deleted`, { actor, book_id: id });
  return { ok: true };
}

const bookBatchPriceSchema = z.object({
  bookId: z.string().min(1),
  entries: z.array(
    z.object({
      batchId: z.string().min(1),
      price: z.number().int().min(0),
      formats: z.array(z.enum(FORMAT_TYPE)).default([]),
    })
  ),
});

export async function setBookBatchPrices(input: z.infer<typeof bookBatchPriceSchema>) {
  await requireAdmin();

  const data = bookBatchPriceSchema.parse(input);

  await db.$transaction(async (tx) => {
    await tx.bookBatchPrice.deleteMany({ where: { bookId: data.bookId } });
    if (data.entries.length > 0) {
      await tx.bookBatchPrice.createMany({
        data: data.entries.map((e) => ({
          bookId: data.bookId,
          batchId: e.batchId,
          price: e.price,
          formats: e.formats,
        })),
      });
    }
  });

  revalidateTag("bookBatchPrices", "max");
  revalidatePath("/admin/books");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/new");
}
