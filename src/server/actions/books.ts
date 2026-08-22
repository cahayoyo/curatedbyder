"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
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

async function ensureUniqueTitle(title: string, excludeId?: string) {
  const existing = await db.book.findUnique({ where: { title } });
  if (existing && existing.id !== excludeId) {
    throw new Error("Judul buku sudah digunakan, gunakan judul lain.");
  }
}

export async function createBook(input: z.infer<typeof bookSchema>) {
  await requireAdmin();


  const data = bookSchema.parse(input);
  await ensureUniqueTitle(data.title);

  try {
    const book = await db.book.create({
      data: {
        title: data.title,
        publisher: orNull(data.publisher),
        info: orNull(data.info),
        image: orNull(data.image),
        price: data.price,
        stock: data.stock,
        status: data.status,
        formats: data.formats,
      },
    });
    revalidatePath("/admin/books");
    return book;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("Judul buku sudah digunakan, gunakan judul lain.");
    }
    throw e;
  }
}

export async function updateBook(id: string, input: z.infer<typeof bookSchema>) {
  await requireAdmin();


  const data = bookSchema.parse(input);
  await ensureUniqueTitle(data.title, id);

  try {
    const book = await db.book.update({
      where: { id },
      data: {
        title: data.title,
        publisher: orNull(data.publisher),
        info: orNull(data.info),
        image: orNull(data.image),
        price: data.price,
        stock: data.stock,
        status: data.status,
        formats: data.formats,
      },
    });
    revalidatePath("/admin/books");
    return book;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("Judul buku sudah digunakan, gunakan judul lain.");
    }
    throw e;
  }
}

export async function deleteBook(id: string) {
  await requireAdmin();


  const sold = await db.orderItem.count({ where: { bookId: id } });
  if (sold > 0) {
    throw new Error("Buku ini sudah pernah terjual dan tidak bisa dihapus.");
  }

  await db.book.delete({ where: { id } });
  revalidatePath("/admin/books");
}
