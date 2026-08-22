"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  STATUS_TYPE,
  ETA_TYPE,
  PAYMENT_TYPE,
} from "@/lib/orderOptions";

const orderSchema = z.object({
  buyerId: z.string().min(1),
  batchId: z.string().min(1),
  eta: z.enum(ETA_TYPE),
  dp: z.number().int().min(0).optional().nullable(),
  paymentStatus: z.enum(PAYMENT_TYPE),
  status: z.enum(STATUS_TYPE),
  items: z
    .array(z.object({ bookId: z.string(), quantity: z.number().int().min(1) }))
    .min(1),
});

async function applyStock(
  tx: Prisma.TransactionClient,
  entries: { bookId: string; amount: number }[]
) {
  const byAmount = new Map<number, string[]>();
  for (const e of entries) {
    const list = byAmount.get(e.amount) ?? [];
    list.push(e.bookId);
    byAmount.set(e.amount, list);
  }
  for (const [amount, ids] of Array.from(byAmount.entries())) {
    await tx.book.updateMany({
      where: { id: { in: ids } },
      data: {
        stock:
          amount >= 0
            ? { increment: amount }
            : { decrement: -amount },
      },
    });
  }
}

export async function createBatch(name: string) {
  await requireAdmin();

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

export async function updateBatch(id: string, name: string) {
  await requireAdmin();

  const batchName = name.trim().toUpperCase();
  if (!batchName) throw new Error("Nama batch tidak boleh kosong");
  if (!/^[A-Z0-9]+$/.test(batchName)) {
    throw new Error("Nama batch hanya boleh huruf/angka (mis. BATCH3)");
  }

  const existing = await db.batch.findFirst({
    where: { name: batchName, id: { not: id } },
  });
  if (existing) return { ok: false, error: "Batch sudah ada" };

  await db.batch.update({ where: { id }, data: { name: batchName } });
  revalidatePath("/admin/orders");
  return { ok: true as const };
}

export async function deleteBatch(id: string) {
  await requireAdmin();

  const batch = await db.batch.findUnique({ where: { id } });
  if (!batch) throw new Error("Batch tidak ditemukan");

  const orderCount = await db.order.count({ where: { batchId: id } });
  if (orderCount > 0) {
    throw new Error(`Batch "${batch.name}" masih dipakai ${orderCount} pesanan`);
  }

  await db.batch.delete({ where: { id } });
  revalidatePath("/admin/orders");
}

export async function createOrder(input: z.infer<typeof orderSchema>) {
  await requireAdmin();

  const data = orderSchema.parse(input);

  const order = await db.$transaction(async (tx) => {
    const [books, countToday] = await Promise.all([
      tx.book.findMany({
        where: { id: { in: data.items.map((i) => i.bookId) } },
        select: { id: true, title: true, price: true, stock: true },
      }),
      (() => {
        const now = new Date();
        return tx.order.count({
          where: {
            soldAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
          },
        });
      })(),
    ]);
    const map = new Map(books.map((b) => [b.id, b]));

    let total = 0;
    const entries: { bookId: string; amount: number }[] = [];
    const items = data.items.map((i) => {
      const book = map.get(i.bookId);
      if (!book || book.stock < i.quantity) {
        throw new Error(`Not enough stock for ${book?.title ?? i.bookId}`);
      }
      total += book.price * i.quantity;
      entries.push({ bookId: i.bookId, amount: -i.quantity });
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
    const invoiceNumber = `INVDER-${day}-${String(countToday + 1).padStart(4, "0")}`;

    const remaining =
      data.dp != null && data.dp > 0 ? Math.max(0, total - data.dp) : null;

    const order = await tx.order.create({
      data: {
        invoiceNumber,
        buyerId: data.buyerId,
        batchId: data.batchId,
        status: data.status,
        total,
        eta: data.eta,
        dp: data.dp,
        remaining,
        paymentStatus: data.paymentStatus,
        items: { create: items },
      },
    });

    await applyStock(tx, entries);

    return order;
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  return order;
}

export async function updateOrder(id: string, input: z.infer<typeof orderSchema>) {
  await requireAdmin();

  const data = orderSchema.parse(input);

  await db.$transaction(async (tx) => {
    const [existing, books] = await Promise.all([
      tx.order.findUnique({
        where: { id },
        include: { items: { select: { bookId: true, quantity: true } } },
      }),
      tx.book.findMany({
        where: { id: { in: data.items.map((i) => i.bookId) } },
        select: { id: true, title: true, price: true, stock: true },
      }),
    ]);
    if (!existing) throw new Error("Order not found");

    const oldMap = new Map(existing.items.map((it) => [it.bookId, it.quantity]));
    const bookMap = new Map(books.map((b) => [b.id, b]));

    let total = 0;
    const createItems: {
      bookId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[] = [];
    const stockChanges: { bookId: string; amount: number }[] = [];

    for (const i of data.items) {
      const book = bookMap.get(i.bookId);
      if (!book) throw new Error(`Book not found for ${i.bookId}`);
      const oldQty = oldMap.get(i.bookId) ?? 0;
      const diff = i.quantity - oldQty;
      if (diff > 0 && book.stock < diff) {
        throw new Error(`Not enough stock for ${book.title}`);
      }
      total += book.price * i.quantity;
      createItems.push({
        bookId: i.bookId,
        quantity: i.quantity,
        unitPrice: book.price,
        subtotal: book.price * i.quantity,
      });
      if (diff !== 0) stockChanges.push({ bookId: i.bookId, amount: -diff });
    }

    for (const [bid, oldQty] of Array.from(oldMap.entries())) {
      if (!data.items.some((i) => i.bookId === bid)) {
        stockChanges.push({ bookId: bid, amount: oldQty });
      }
    }

    const remaining =
      data.dp != null && data.dp > 0 ? Math.max(0, total - data.dp) : null;

    await tx.order.update({
      where: { id },
      data: {
        buyerId: data.buyerId,
        batchId: data.batchId,
        eta: data.eta,
        dp: data.dp,
        remaining,
        paymentStatus: data.paymentStatus,
        total,
        status: data.status,
        items: {
          deleteMany: {},
          create: createItems,
        },
      },
    });

    await applyStock(tx, stockChanges);
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
}

export async function updateOrderStatus(id: string, status: string) {
  await requireAdmin();

  const valid = z.enum(STATUS_TYPE).parse(status);
  const order = await db.order.update({ where: { id }, data: { status: valid } });

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return order;
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  await requireAdmin();

  const valid = z.enum(PAYMENT_TYPE).parse(paymentStatus);
  const order = await db.order.update({ where: { id }, data: { paymentStatus: valid } });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return order;
}

export async function deleteOrder(id: string) {
  await requireAdmin();

  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: { select: { bookId: true, quantity: true } } },
    });
    if (!order) throw new Error("Order not found");

    await applyStock(
      tx,
      order.items.map((it) => ({ bookId: it.bookId, amount: it.quantity }))
    );
    await tx.order.delete({ where: { id } });
  });

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}