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

const orderSchema = z.object({
  buyerId: z.string().min(1),
  source: z.enum(["INSTAGRAM", "SHOPEE", "OTHER"]),
  batchId: z.string().min(1),
  eta: z.enum(["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]),
  dp: z.number().int().min(0).optional().nullable(),
  paymentStatus: z.enum(["NO_PAYMENT", "LUNAS", "DONE_DP"]),
  status: statusEnum,
  items: z
    .array(z.object({ bookId: z.string(), quantity: z.number().int().min(1) }))
    .min(1),
});

export async function createBatch(name: string) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  const batchName = name.trim().toUpperCase();
  if (!batchName) throw new Error("Nama batch tidak boleh kosong");
  if (!/^[A-Z0-9]+$/.test(batchName)) {
    throw new Error("Nama batch hanya boleh huruf/angka (mis. BATCH3)");
  }

  const existing = await db.batch.findUnique({ where: { name: batchName } });
  if (existing) return { ok: false, error: "Batch sudah ada" };

  await db.batch.create({ data: { name: batchName } });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/new");
  return { ok: true as const };
}

export async function createOrder(input: z.infer<typeof orderSchema>) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  const data = orderSchema.parse(input);

  const order = await db.$transaction(async (tx) => {
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
    const countToday = await tx.order.count({
      where: { soldAt: { gte: startOfDay } },
    });
    const invoiceNumber = `INVDER-${day}-${String(countToday + 1).padStart(4, "0")}`;

    const remaining =
      data.dp != null && data.dp > 0 ? Math.max(0, total - data.dp) : null;

    const order = await tx.order.create({
      data: {
        invoiceNumber,
        buyerId: data.buyerId,
        source: data.source,
        batchId: data.batchId,
        status: "ORDER_PLACED",
        total,
        eta: data.eta,
        dp: data.dp,
        remaining,
        paymentStatus: data.paymentStatus,
        items: { create: items },
      },
    });

    for (const i of items) {
      await tx.book.update({
        where: { id: i.bookId },
        data: { stock: { decrement: i.quantity } },
      });
    }

    return order;
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  return order;
}

export async function updateOrder(id: string, input: z.infer<typeof orderSchema>) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  const data = orderSchema.parse(input);

  await db.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) throw new Error("Order not found");

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

    await tx.order.update({
      where: { id },
      data: {
        buyerId: data.buyerId,
        source: data.source,
        batchId: data.batchId,
        eta: data.eta,
        dp: data.dp,
        remaining,
        paymentStatus: data.paymentStatus,
        total,
        status: data.status,
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
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
}

export async function updateOrderStatus(id: string, status: string) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  const valid = statusEnum.parse(status);
  const order = await db.order.update({ where: { id }, data: { status: valid } });

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return order;
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  const valid = z.enum(["NO_PAYMENT", "LUNAS", "DONE_DP"]).parse(paymentStatus);
  const order = await db.order.update({ where: { id }, data: { paymentStatus: valid } });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return order;
}

export async function deleteOrder(id: string) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) throw new Error("Forbidden");

  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");

    for (const item of order.items) {
      await tx.book.update({
        where: { id: item.bookId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.order.delete({ where: { id } });
  });

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}