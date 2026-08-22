"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

function isAdmin(session: { user?: {
  id?: string;
  role?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
} } | null): boolean {
  return session?.user?.role === "SUPER_ADMIN";
}

const statusEnum = z.enum([
  "ORDER_PLACED",
  "SHIPPING_TO_INDONESIA",
  "ARRIVED_IN_INDONESIA",
  "ARRIVED_AT_WAREHOUSE",
  "SHIPPED_TO_CUSTOMER",
  "ORDER_DELIVERED",
]);

const saleSchema = z.object({
  buyerId: z.string().min(1),
  source: z.enum(["INSTAGRAM", "SHOPEE", "OTHER"]),
  eta: z
    .enum(["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"])
    .optional()
    .nullable(),
  format: z.enum(["HC", "PB", "BB", "BS", "SB"]).optional().nullable(),
  dp: z.number().int().min(0).optional().nullable(),
  paymentStatus: z.enum(["NO_PAYMENT", "LUNAS", "DONE_DP"]).optional().nullable(),
  status: statusEnum.optional(),
  items: z
    .array(z.object({ bookId: z.string(), quantity: z.number().int().min(1) }))
    .min(1),
});

export async function createSale(input: z.infer<typeof saleSchema>) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  const data = saleSchema.parse(input);

  const sale = await db.$transaction(async (tx) => {
    const books = await tx.book.findMany({
      where: { id: { in: data.items.map((i) => i.bookId) } },
    });
    const map = new Map(books.map((b) => [b.id, b]));

    let total = 0;
    const items = data.items.map((i) => {
      const book = map.get(i.bookId);
      if (!book || book.stock < i.quantity) {
        throw new Error(`Not enough stock for ${book?.title ?? i.bookId}`);
      }
      total += book.price * i.quantity;
      return {
        bookId: i.bookId,
        quantity: i.quantity,
        unitPrice: book.price,
        subtotal: book.price * i.quantity,
      };
    });

    const now = new Date();
    const day = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const countToday = await tx.sale.count({
      where: { soldAt: { gte: startOfDay } },
    });
    const invoiceNumber = `INVDER-${day}-${String(countToday + 1).padStart(4, "0")}`;

    const remaining =
      data.dp != null && data.dp > 0 ? Math.max(0, total - data.dp) : null;

    const sale = await tx.sale.create({
      data: {
        invoiceNumber,
        buyerId: data.buyerId,
        source: data.source,
        status: "ORDER_PLACED",
        total,
        eta: data.eta,
        format: data.format,
        dp: data.dp,
        remaining,
        paymentStatus: data.paymentStatus ?? "NO_PAYMENT",
        items: { create: items },
      },
    });

    for (const i of items) {
      await tx.book.update({
        where: { id: i.bookId },
        data: { stock: { decrement: i.quantity } },
      });
    }

    return sale;
  });

  revalidatePath("/admin");
  revalidatePath("/admin/sales");
  revalidatePath("/dashboard");
  return sale;
}

export async function updateSale(id: string, input: z.infer<typeof saleSchema>) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  const data = saleSchema.parse(input);

  await db.$transaction(async (tx) => {
    const existing = await tx.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) throw new Error("Sale not found");

    const oldMap = new Map(existing.items.map((it) => [it.bookId, it.quantity]));

    const books = await tx.book.findMany({
      where: { id: { in: data.items.map((i) => i.bookId) } },
    });
    const bookMap = new Map(books.map((b) => [b.id, b]));

    let total = 0;
    const items = data.items.map((i) => {
      const book = bookMap.get(i.bookId);
      if (!book) throw new Error(`Book not found for ${i.bookId}`);
      const oldQty = oldMap.get(i.bookId) ?? 0;
      const diff = i.quantity - oldQty;
      if (diff > 0 && book.stock < diff) {
        throw new Error(`Not enough stock for ${book.title}`);
      }
      total += book.price * i.quantity;
      return {
        bookId: i.bookId,
        quantity: i.quantity,
        unitPrice: book.price,
        subtotal: book.price * i.quantity,
        diff,
      };
    });

    const removedBooks = Array.from(oldMap.keys()).filter(
      (bid) => !data.items.some((i) => i.bookId === bid)
    );
    for (const bid of removedBooks) {
      await tx.book.update({
        where: { id: bid },
        data: { stock: { increment: oldMap.get(bid) ?? 0 } },
      });
    }

    for (const it of items) {
      if (it.diff === 0) continue;
      await tx.book.update({
        where: { id: it.bookId },
        data: {
          stock: it.diff > 0 ? { decrement: it.diff } : { increment: -it.diff },
        },
      });
    }

    const remaining =
      data.dp != null && data.dp > 0 ? Math.max(0, total - data.dp) : null;

    await tx.sale.update({
      where: { id },
      data: {
        buyerId: data.buyerId,
        source: data.source,
        eta: data.eta,
        format: data.format,
        dp: data.dp,
        remaining,
        paymentStatus: data.paymentStatus ?? "NO_PAYMENT",
        total,
        ...(data.status ? { status: data.status } : {}),
        items: {
          deleteMany: {},
          create: items.map((it) => ({
            bookId: it.bookId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            subtotal: it.subtotal,
          })),
        },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/sales");
  revalidatePath("/dashboard");
}

export async function updateSaleStatus(id: string, status: string) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  const valid = statusEnum.parse(status);
  const sale = await db.sale.update({ where: { id }, data: { status: valid } });

  revalidatePath("/admin/sales");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return sale;
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  const valid = z.enum(["NO_PAYMENT", "LUNAS", "DONE_DP"]).parse(paymentStatus);
  const sale = await db.sale.update({ where: { id }, data: { paymentStatus: valid } });

  revalidatePath("/admin/sales");
  revalidatePath("/admin");
  return sale;
}

export async function deleteSale(id: string) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  await db.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) throw new Error("Sale not found");

    for (const item of sale.items) {
      await tx.book.update({
        where: { id: item.bookId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.sale.delete({ where: { id } });
  });

  revalidatePath("/admin/sales");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}