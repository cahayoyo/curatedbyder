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
  shippingCost: z.number().int().min(0).optional().nullable(),
  trackingNumber: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  paymentStatus: z.enum(PAYMENT_TYPE),
  status: z.enum(STATUS_TYPE),
  items: z
    .array(
      z.object({
        bookId: z.string().optional().nullable(),
        toyId: z.string().optional().nullable(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().int().min(0).optional(),
      })
    )
    .min(1)
    .refine((items) => items.every((i) => i.bookId || i.toyId), {
      message: "Setiap item wajib memiliki buku atau mainan",
    }),
});

async function applyStock(
  tx: Prisma.TransactionClient,
  entries: { bookId?: string | null; toyId?: string | null; amount: number }[]
) {
  const bookByAmount = new Map<number, string[]>();
  for (const e of entries) {
    if (!e.bookId) continue;
    const list = bookByAmount.get(e.amount) ?? [];
    list.push(e.bookId);
    bookByAmount.set(e.amount, list);
  }
  for (const [amount, ids] of Array.from(bookByAmount.entries())) {
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

  const toyByAmount = new Map<number, string[]>();
  for (const e of entries) {
    if (!e.toyId) continue;
    const list = toyByAmount.get(e.amount) ?? [];
    list.push(e.toyId);
    toyByAmount.set(e.amount, list);
  }
  for (const [amount, ids] of Array.from(toyByAmount.entries())) {
    await tx.toy.updateMany({
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
    const bookIds = data.items.filter((i) => i.bookId).map((i) => i.bookId as string);
    const toyIds = data.items.filter((i) => i.toyId).map((i) => i.toyId as string);
    const [books, toys, batchPrices, countToday] = await Promise.all([
      tx.book.findMany({
        where: { id: { in: bookIds } },
        select: { id: true, title: true, price: true, stock: true },
      }),
      tx.toy.findMany({
        where: { id: { in: toyIds } },
        select: { id: true, title: true, price: true, stock: true },
      }),
      tx.bookBatchPrice.findMany({
        where: { batchId: data.batchId, bookId: { in: bookIds } },
        select: { bookId: true, price: true },
      }),
      (() => {
        const now = new Date();
        return tx.order.aggregate({
          where: {
            soldAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
          },
          _max: { invoiceNumber: true },
        });
      })(),
    ]);
    const bookMap = new Map(books.map((b) => [b.id, b]));
    const toyMap = new Map(toys.map((t) => [t.id, t]));
    const batchPriceMap = new Map(batchPrices.map((bp) => [bp.bookId, bp.price]));

    const effectiveBookPrice = (bookId: string, override?: number) =>
      override ?? batchPriceMap.get(bookId) ?? bookMap.get(bookId)?.price ?? 0;
    const effectiveToyPrice = (toyId: string, override?: number) =>
      override ?? toyMap.get(toyId)?.price ?? 0;

    let total = 0;
    const entries: { bookId?: string; toyId?: string; amount: number }[] = [];
    const items = data.items.map((i) => {
      if (i.unitPrice == null) {
        throw new Error(`Harga wajib diisi untuk setiap item`);
      }
      if (i.bookId) {
        const book = bookMap.get(i.bookId);
        if (!book || book.stock < i.quantity) {
          throw new Error(`Not enough stock for ${book?.title ?? i.bookId}`);
        }
        const price = effectiveBookPrice(i.bookId, i.unitPrice);
        total += price * i.quantity;
        entries.push({ bookId: i.bookId, amount: -i.quantity });
        return {
          bookId: i.bookId,
          toyId: null,
          quantity: i.quantity,
          unitPrice: price,
          subtotal: price * i.quantity,
        };
      }
      const toy = toyMap.get(i.toyId as string);
      if (!toy || toy.stock < i.quantity) {
        throw new Error(`Not enough stock for ${toy?.title ?? i.toyId}`);
      }
      const price = effectiveToyPrice(i.toyId as string, i.unitPrice);
      total += price * i.quantity;
      entries.push({ toyId: i.toyId as string, amount: -i.quantity });
      return {
        bookId: null,
        toyId: i.toyId as string,
        quantity: i.quantity,
        unitPrice: price,
        subtotal: price * i.quantity,
      };
    });

    const now = new Date();
    const day = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const lastInvoice = countToday._max?.invoiceNumber;
    const lastSeq = lastInvoice ? Number(lastInvoice.split("-").pop()) || 0 : 0;
    const invoiceNumber = `INVDER-${day}-${String(lastSeq + 1).padStart(4, "0")}`;

    const shippingCost = data.shippingCost ?? 0;
    const orderTotal = total + shippingCost;
    const remaining =
      data.dp != null && data.dp > 0
        ? Math.max(0, orderTotal - data.dp)
        : null;

    const order = await tx.order.create({
      data: {
        invoiceNumber,
        buyerId: data.buyerId,
        batchId: data.batchId,
        status: data.status,
        total: orderTotal,
        eta: data.eta,
        dp: data.dp,
        remaining,
        shippingCost: data.shippingCost,
        trackingNumber: data.trackingNumber,
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
    const bookIds = data.items.filter((i) => i.bookId).map((i) => i.bookId as string);
    const toyIds = data.items.filter((i) => i.toyId).map((i) => i.toyId as string);
    const [existing, books, toys, batchPrices] = await Promise.all([
      tx.order.findUnique({
        where: { id },
        include: { items: { select: { bookId: true, toyId: true, quantity: true } } },
      }),
      tx.book.findMany({
        where: { id: { in: bookIds } },
        select: { id: true, title: true, price: true, stock: true },
      }),
      tx.toy.findMany({
        where: { id: { in: toyIds } },
        select: { id: true, title: true, price: true, stock: true },
      }),
      tx.bookBatchPrice.findMany({
        where: { batchId: data.batchId, bookId: { in: bookIds } },
        select: { bookId: true, price: true },
      }),
    ]);
    if (!existing) throw new Error("Order not found");

    const oldMap = new Map(
      existing.items.map((it) => [it.bookId ?? it.toyId ?? "", it.quantity])
    );
    const bookMap = new Map(books.map((b) => [b.id, b]));
    const toyMap = new Map(toys.map((t) => [t.id, t]));
    const batchPriceMap = new Map(batchPrices.map((bp) => [bp.bookId, bp.price]));
    const effectiveBookPrice = (bookId: string, override?: number) =>
      override ?? batchPriceMap.get(bookId) ?? bookMap.get(bookId)?.price ?? 0;
    const effectiveToyPrice = (toyId: string, override?: number) =>
      override ?? toyMap.get(toyId)?.price ?? 0;

    let total = 0;
    const createItems: {
      bookId: string | null;
      toyId: string | null;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[] = [];
    const stockChanges: { bookId?: string; toyId?: string; amount: number }[] = [];

    for (const i of data.items) {
      if (i.unitPrice == null) {
        throw new Error(`Harga wajib diisi untuk setiap item`);
      }
      const key = i.bookId ?? i.toyId ?? "";
      const oldQty = oldMap.get(key) ?? 0;
      const diff = i.quantity - oldQty;
      if (i.bookId) {
        const book = bookMap.get(i.bookId);
        if (!book) throw new Error(`Buku tidak ditemukan: ${i.bookId}`);
        if (diff > 0 && book.stock < diff) {
          throw new Error(`Not enough stock for ${book.title}`);
        }
        const price = effectiveBookPrice(i.bookId, i.unitPrice);
        total += price * i.quantity;
        createItems.push({
          bookId: i.bookId,
          toyId: null,
          quantity: i.quantity,
          unitPrice: price,
          subtotal: price * i.quantity,
        });
        if (diff !== 0) stockChanges.push({ bookId: i.bookId, amount: -diff });
      } else {
        const toy = toyMap.get(i.toyId as string);
        if (!toy) throw new Error(`Mainan tidak ditemukan: ${i.toyId}`);
        if (diff > 0 && toy.stock < diff) {
          throw new Error(`Not enough stock for ${toy.title}`);
        }
        const price = effectiveToyPrice(i.toyId as string, i.unitPrice);
        total += price * i.quantity;
        createItems.push({
          bookId: null,
          toyId: i.toyId as string,
          quantity: i.quantity,
          unitPrice: price,
          subtotal: price * i.quantity,
        });
        if (diff !== 0) stockChanges.push({ toyId: i.toyId as string, amount: -diff });
      }
    }

    for (const [bid, oldQty] of Array.from(oldMap.entries())) {
      if (!data.items.some((i) => (i.bookId ?? i.toyId ?? "") === bid)) {
        const book = bookMap.get(bid);
        const toy = toyMap.get(bid);
        if (book) stockChanges.push({ bookId: bid, amount: oldQty });
        else if (toy) stockChanges.push({ toyId: bid, amount: oldQty });
      }
    }

    const shippingCost = data.shippingCost ?? 0;
    const orderTotal = total + shippingCost;
    const remaining =
      data.dp != null && data.dp > 0
        ? Math.max(0, orderTotal - data.dp)
        : null;

    await tx.order.update({
      where: { id },
      data: {
        buyerId: data.buyerId,
        batchId: data.batchId,
        eta: data.eta,
        dp: data.dp,
        remaining,
        shippingCost: data.shippingCost,
        trackingNumber: data.trackingNumber,
        paymentStatus: data.paymentStatus,
        total: orderTotal,
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
      include: { items: { select: { bookId: true, toyId: true, quantity: true } } },
    });
    if (!order) throw new Error("Order not found");

    await applyStock(
      tx,
      order.items.map((it) => ({
        bookId: it.bookId,
        toyId: it.toyId,
        amount: it.quantity,
      }))
    );
    await tx.order.delete({ where: { id } });
  });

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}