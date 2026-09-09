"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { Prisma, type Order } from "@prisma/client";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { emitLog } from "@/instrumentation";
import { ActionResult, ActionResultWithData, UserInputError } from "@/lib/actionResult";
import { formatIDR } from "@/lib/format";
import {
  STATUS_TYPE,
  ETA_TYPE,
  PAYMENT_TYPE,
} from "@/lib/orderOptions";

const orderSchema = z.object({
  buyerId: z.string().min(1),
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
  items: z
    .array(
      z.object({
        bookId: z.string().optional().nullable(),
        toyId: z.string().optional().nullable(),
        batchId: z.string().min(1),
        eta: z.enum(ETA_TYPE),
        quantity: z.number().int().min(1),
        unitPrice: z.number().int().min(0).optional(),
      })
    )
    .min(1)
    .refine((items) => items.every((i) => i.bookId || i.toyId), {
      message: "Setiap item wajib memiliki buku atau mainan",
    }),
});

const orderPaymentSchema = z.object({
  amount: z.number().int().min(1),
  proofUrl: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  note: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  paidAt: z.coerce.date().nullish(),
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
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const batchName = name.trim().toUpperCase();
  if (!batchName) return { ok: false as const, error: "Nama batch tidak boleh kosong" };
  if (!/^[A-Z0-9]+( [A-Z0-9]+)*$/.test(batchName)) {
    return { ok: false as const, error: "Nama batch hanya boleh huruf/angka/spasi (mis. READY STOCK)" };
  }

  const existing = await db.batch.findUnique({ where: { name: batchName } });
  if (existing) return { ok: false, error: "Batch sudah ada" };

  try {
    await db.batch.create({ data: { name: batchName } });
  } catch (e) {
    emitLog(`Batch "${batchName}" save failed`, { actor, name: batchName, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
  revalidateTag("batches", "max");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/new");
  emitLog(`Batch "${batchName}" created`, { actor, name: batchName });
  return { ok: true as const };
}

export async function updateBatch(id: string, name: string) {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const batchName = name.trim().toUpperCase();
  if (!batchName) return { ok: false as const, error: "Nama batch tidak boleh kosong" };
  if (!/^[A-Z0-9]+( [A-Z0-9]+)*$/.test(batchName)) {
    return { ok: false as const, error: "Nama batch hanya boleh huruf/angka/spasi (mis. READY STOCK)" };
  }

  const existing = await db.batch.findFirst({
    where: { name: batchName, id: { not: id } },
  });
  if (existing) return { ok: false, error: "Batch sudah ada" };

  try {
    await db.batch.update({ where: { id }, data: { name: batchName } });
  } catch (e) {
    emitLog(`Batch "${batchName}" update failed`, { actor, batch_id: id, name: batchName, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
  revalidateTag("batches", "max");
  revalidatePath("/admin/orders");
  emitLog(`Batch "${batchName}" updated`, { actor, batch_id: id, name: batchName });
  return { ok: true as const };
}

export async function deleteBatch(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const batch = await db.batch.findUnique({ where: { id } });
  if (!batch) throw new Error("Batch tidak ditemukan");

  const itemCount = await db.orderItem.count({ where: { batchId: id } });
  if (itemCount > 0) {
    return { ok: false, error: `Batch "${batch.name}" masih dipakai ${itemCount} item pesanan` };
  }

  try {
    await db.batch.delete({ where: { id } });
  } catch (e) {
    emitLog(`Batch "${batch.name}" delete failed`, { actor, batch_id: id, name: batch.name, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
  revalidateTag("batches", "max");
  revalidatePath("/admin/orders");
  emitLog(`Batch "${batch.name}" deleted`, { actor, batch_id: id, name: batch.name });
  return { ok: true };
}

export async function createOrder(
  input: z.infer<typeof orderSchema>
): Promise<ActionResultWithData<Order>> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const data = orderSchema.parse(input);

  const run = (seqOffset: number) =>
    db.$transaction(async (tx) => {
      const bookIds = data.items.filter((i) => i.bookId).map((i) => i.bookId as string);
      const toyIds = data.items.filter((i) => i.toyId).map((i) => i.toyId as string);
      const itemBatchIds = Array.from(new Set(data.items.map((i) => i.batchId)));
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
          where: { batchId: { in: itemBatchIds }, bookId: { in: bookIds } },
          select: { batchId: true, bookId: true, price: true },
        }),
        tx.order.aggregate({
          where: {
            soldAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
            },
          },
          _max: { invoiceNumber: true },
        }),
      ]);
      const bookMap = new Map(books.map((b) => [b.id, b]));
      const toyMap = new Map(toys.map((t) => [t.id, t]));
      const batchPriceMap = new Map(
        batchPrices.map((bp) => [`${bp.batchId}:${bp.bookId}`, bp.price])
      );

      const effectiveBookPrice = (batchId: string, bookId: string, override?: number) =>
        override ?? batchPriceMap.get(`${batchId}:${bookId}`) ?? bookMap.get(bookId)?.price ?? 0;
      const effectiveToyPrice = (toyId: string, override?: number) =>
        override ?? toyMap.get(toyId)?.price ?? 0;

      let total = 0;
      const entries: { bookId?: string; toyId?: string; amount: number }[] = [];
      const items = data.items.map((i) => {
        if (i.unitPrice == null) {
          throw new UserInputError(`Harga wajib diisi untuk setiap item`);
        }
        if (i.bookId) {
          const book = bookMap.get(i.bookId);
          if (!book || book.stock < i.quantity) {
            throw new UserInputError(`Not enough stock for ${book?.title ?? i.bookId}`);
          }
          const price = effectiveBookPrice(i.batchId, i.bookId, i.unitPrice);
          total += price * i.quantity;
          entries.push({ bookId: i.bookId, amount: -i.quantity });
          return {
            bookId: i.bookId,
            toyId: null,
            batchId: i.batchId,
            eta: i.eta,
            quantity: i.quantity,
            unitPrice: price,
            subtotal: price * i.quantity,
          };
        }
        const toy = toyMap.get(i.toyId as string);
        if (!toy || toy.stock < i.quantity) {
          throw new UserInputError(`Not enough stock for ${toy?.title ?? i.toyId}`);
        }
        const price = effectiveToyPrice(i.toyId as string, i.unitPrice);
        total += price * i.quantity;
        entries.push({ toyId: i.toyId as string, amount: -i.quantity });
        return {
          bookId: null,
          toyId: i.toyId as string,
          batchId: i.batchId,
          eta: i.eta,
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
      const invoiceNumber = `INVDER-${day}-${String(lastSeq + 1 + seqOffset).padStart(4, "0")}`;

      const shippingCost = data.shippingCost ?? 0;
      const orderTotal = total + shippingCost;
      const remaining = Math.max(0, orderTotal - (data.dp ?? 0));

      const order = await tx.order.create({
        data: {
          invoiceNumber,
          buyerId: data.buyerId,
          total: orderTotal,
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

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const order = await run(attempt);
      emitLog(`Order ${order.invoiceNumber} created`, {
        actor,
        invoice_number: order.invoiceNumber,
        total: order.total,
        item_count: data.items.length,
        payment_status: data.paymentStatus,
      });
      revalidateTag("books", "max");
      revalidateTag("toys", "max");
      revalidatePath("/admin");
      revalidatePath("/admin/orders");
      revalidatePath("/dashboard");
      return { ok: true, data: order };
    } catch (e) {
      if (e instanceof UserInputError) {
        return { ok: false, error: e.message };
      }
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        Array.isArray(e.meta?.target) &&
        (e.meta?.target as string[]).includes("invoiceNumber")
      ) {
        continue;
      }
      emitLog("Order save failed", { actor, error: String(e) }, SeverityNumber.ERROR);
      throw e;
    }
  }

  return { ok: false, error: "Gagal membuat nomor invoice, coba lagi." };
}

export async function updateOrder(
  id: string,
  input: z.infer<typeof orderSchema>
): Promise<ActionResult> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const data = orderSchema.parse(input);
  let invoiceNumber: string | undefined;

  try {
    await db.$transaction(async (tx) => {
    const bookIds = data.items.filter((i) => i.bookId).map((i) => i.bookId as string);
    const toyIds = data.items.filter((i) => i.toyId).map((i) => i.toyId as string);
    const itemBatchIds = Array.from(new Set(data.items.map((i) => i.batchId)));
    const [existing, books, toys, batchPrices] = await Promise.all([
      tx.order.findUnique({
        where: { id },
        include: { items: { select: { bookId: true, toyId: true, quantity: true, status: true } } },
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
        where: { batchId: { in: itemBatchIds }, bookId: { in: bookIds } },
        select: { batchId: true, bookId: true, price: true },
      }),
    ]);
    if (!existing) throw new Error("Order not found");
    invoiceNumber = existing.invoiceNumber;

    const oldMap = new Map(
      existing.items.map((it) => [it.bookId ?? it.toyId ?? "", it.quantity])
    );
    const oldStatusMap = new Map(
      existing.items.map((it) => [it.bookId ?? it.toyId ?? "", it.status])
    );
    const bookMap = new Map(books.map((b) => [b.id, b]));
    const toyMap = new Map(toys.map((t) => [t.id, t]));
    const batchPriceMap = new Map(
      batchPrices.map((bp) => [`${bp.batchId}:${bp.bookId}`, bp.price])
    );
    const effectiveBookPrice = (batchId: string, bookId: string, override?: number) =>
      override ?? batchPriceMap.get(`${batchId}:${bookId}`) ?? bookMap.get(bookId)?.price ?? 0;
    const effectiveToyPrice = (toyId: string, override?: number) =>
      override ?? toyMap.get(toyId)?.price ?? 0;

    let total = 0;
    const createItems: {
      bookId: string | null;
      toyId: string | null;
      batchId: string;
      eta: (typeof ETA_TYPE)[number];
      quantity: number;
      unitPrice: number;
      subtotal: number;
      status: (typeof STATUS_TYPE)[number];
    }[] = [];
    const stockChanges: { bookId?: string; toyId?: string; amount: number }[] = [];

    for (const i of data.items) {
      if (i.unitPrice == null) {
        throw new UserInputError(`Harga wajib diisi untuk setiap item`);
      }
      const key = i.bookId ?? i.toyId ?? "";
      const oldQty = oldMap.get(key) ?? 0;
      const diff = i.quantity - oldQty;
      if (i.bookId) {
        const book = bookMap.get(i.bookId);
        if (!book) throw new UserInputError(`Buku tidak ditemukan: ${i.bookId}`);
        if (diff > 0 && book.stock < diff) {
          throw new UserInputError(`Not enough stock for ${book.title}`);
        }
        const price = effectiveBookPrice(i.batchId, i.bookId, i.unitPrice);
        total += price * i.quantity;
        createItems.push({
          bookId: i.bookId,
          toyId: null,
          batchId: i.batchId,
          eta: i.eta,
          quantity: i.quantity,
          unitPrice: price,
          subtotal: price * i.quantity,
          status: oldStatusMap.get(key) ?? "ORDER_PLACED",
        });
        if (diff !== 0) stockChanges.push({ bookId: i.bookId, amount: -diff });
      } else {
        const toy = toyMap.get(i.toyId as string);
        if (!toy) throw new UserInputError(`Mainan tidak ditemukan: ${i.toyId}`);
        if (diff > 0 && toy.stock < diff) {
          throw new UserInputError(`Not enough stock for ${toy.title}`);
        }
        const price = effectiveToyPrice(i.toyId as string, i.unitPrice);
        total += price * i.quantity;
        createItems.push({
          bookId: null,
          toyId: i.toyId as string,
          batchId: i.batchId,
          eta: i.eta,
          quantity: i.quantity,
          unitPrice: price,
          subtotal: price * i.quantity,
          status: oldStatusMap.get(key) ?? "ORDER_PLACED",
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
    const paid = await tx.orderPayment.aggregate({
      where: { orderId: id },
      _sum: { amount: true },
    });
    const remaining = Math.max(0, orderTotal - (data.dp ?? 0) - (paid._sum.amount ?? 0));

    await tx.order.update({
      where: { id },
      data: {
        buyerId: data.buyerId,
        dp: data.dp,
        remaining,
        shippingCost: data.shippingCost,
        trackingNumber: data.trackingNumber,
        paymentStatus: data.paymentStatus,
        total: orderTotal,
        items: {
          deleteMany: {},
          create: createItems,
        },
      },
    });

    await applyStock(tx, stockChanges);
    });
  } catch (e) {
    if (e instanceof UserInputError) return { ok: false, error: e.message };
    emitLog(`Order ${invoiceNumber ?? id} update failed`, { actor, order_id: id, invoice_number: invoiceNumber, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }

  revalidateTag("books", "max");
  revalidateTag("toys", "max");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  emitLog(`Order ${invoiceNumber ?? id} updated`, {
    actor,
    order_id: id,
    invoice_number: invoiceNumber,
    item_count: data.items.length,
    payment_status: data.paymentStatus,
  });
  return { ok: true };
}

export async function updateOrderItemStatus(itemId: string, status: string) {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const valid = z.enum(STATUS_TYPE).parse(status);
  try {
    await db.orderItem.update({ where: { id: itemId }, data: { status: valid } });
  } catch (e) {
    emitLog(`Order item ${itemId} status update failed`, { actor, item_id: itemId, status: valid, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  emitLog(`Order item ${itemId} status updated to ${valid}`, { actor, item_id: itemId, status: valid });
  return valid;
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const valid = z.enum(PAYMENT_TYPE).parse(paymentStatus);
  try {
    const order = await db.order.update({ where: { id }, data: { paymentStatus: valid } });
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    emitLog(`Order ${order.invoiceNumber} payment status updated to ${valid}`, { actor, order_id: id, invoice_number: order.invoiceNumber, payment_status: valid });
    return order;
  } catch (e) {
    emitLog(`Order ${id} payment status update failed`, { actor, order_id: id, payment_status: valid, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
}

export async function deleteOrder(id: string) {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  let invoiceNumber: string | undefined;
  try {
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: { select: { bookId: true, toyId: true, quantity: true } } },
      });
      if (!order) throw new Error("Order not found");
      invoiceNumber = order.invoiceNumber;

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
  } catch (e) {
    emitLog(`Order ${invoiceNumber ?? id} delete failed`, { actor, order_id: id, invoice_number: invoiceNumber, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }

  revalidateTag("books", "max");
  revalidateTag("toys", "max");
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  emitLog(`Order ${invoiceNumber ?? id} deleted`, { actor, order_id: id, invoice_number: invoiceNumber });
}

type OrderPaymentInput = {
  amount: number;
  proofUrl?: string | null;
  note?: string | null;
  paidAt?: Date | null;
};

export async function addOrderPayment(
  orderId: string,
  input: OrderPaymentInput
): Promise<ActionResult> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const data = orderPaymentSchema.parse(input);

  try {
    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, invoiceNumber: true, total: true, dp: true },
      });
      if (!order) throw new UserInputError("Pesanan tidak ditemukan");

      const paid = await tx.orderPayment.aggregate({
        where: { orderId },
        _sum: { amount: true },
      });
      const sisa = Math.max(0, order.total - (order.dp ?? 0) - (paid._sum.amount ?? 0));
      if (data.amount > sisa) {
        throw new UserInputError(`Jumlah pembayaran melebihi sisa tagihan (${formatIDR(sisa)})`);
      }

      await tx.orderPayment.create({
        data: {
          orderId,
          amount: data.amount,
          proofUrl: data.proofUrl,
          note: data.note,
          paidAt: data.paidAt ?? new Date(),
        },
      });

      const count = await tx.orderPayment.count({ where: { orderId } });
      const remaining = Math.max(0, sisa - data.amount);
      const orderUpdate: Prisma.OrderUpdateInput = { remaining };
      if (remaining === 0) orderUpdate.paymentStatus = "LUNAS";
      await tx.order.update({ where: { id: orderId }, data: orderUpdate });

      return { invoiceNumber: order.invoiceNumber, remaining, count };
    });

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/dashboard");
    emitLog(`Order ${result.invoiceNumber} payment ${result.count} added`, {
      actor,
      order_id: orderId,
      invoice_number: result.invoiceNumber,
      amount: data.amount,
      remaining: result.remaining,
      has_proof: Boolean(data.proofUrl),
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof UserInputError) return { ok: false, error: e.message };
    emitLog(`Order payment add failed`, { actor, order_id: orderId, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
}

export async function updateOrderPayment(
  paymentId: string,
  input: OrderPaymentInput
): Promise<ActionResult> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const data = orderPaymentSchema.parse(input);

  try {
    const result = await db.$transaction(async (tx) => {
      const payment = await tx.orderPayment.findUnique({ where: { id: paymentId } });
      if (!payment) throw new UserInputError("Pembayaran tidak ditemukan");
      const order = await tx.order.findUnique({
        where: { id: payment.orderId },
        select: { id: true, invoiceNumber: true, total: true, dp: true },
      });
      if (!order) throw new UserInputError("Pesanan tidak ditemukan");

      const paid = await tx.orderPayment.aggregate({
        where: { orderId: order.id, NOT: { id: paymentId } },
        _sum: { amount: true },
      });
      const sisa = Math.max(0, order.total - (order.dp ?? 0) - (paid._sum.amount ?? 0));
      if (data.amount > sisa) {
        throw new UserInputError(`Jumlah pembayaran melebihi sisa tagihan (${formatIDR(sisa)})`);
      }

      await tx.orderPayment.update({
        where: { id: paymentId },
        data: {
          amount: data.amount,
          proofUrl: data.proofUrl,
          note: data.note,
          paidAt: data.paidAt ?? payment.paidAt,
        },
      });

      const remaining = Math.max(0, sisa - data.amount);
      const orderUpdate: Prisma.OrderUpdateInput = { remaining };
      if (remaining === 0) orderUpdate.paymentStatus = "LUNAS";
      await tx.order.update({ where: { id: order.id }, data: orderUpdate });

      return { invoiceNumber: order.invoiceNumber, remaining };
    });

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/dashboard");
    emitLog(`Order ${result.invoiceNumber} payment updated`, {
      actor,
      order_id: paymentId,
      invoice_number: result.invoiceNumber,
      amount: data.amount,
      remaining: result.remaining,
      has_proof: Boolean(data.proofUrl),
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof UserInputError) return { ok: false, error: e.message };
    emitLog(`Order payment update failed`, { actor, payment_id: paymentId, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
}

const orderDpSchema = z.object({
  amount: z.number().int().min(0),
  proofUrl: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export async function updateOrderDp(
  orderId: string,
  input: { amount: number; proofUrl?: string | null }
): Promise<ActionResult> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  const data = orderDpSchema.parse(input);

  try {
    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, invoiceNumber: true, total: true },
      });
      if (!order) throw new UserInputError("Pesanan tidak ditemukan");

      const paid = await tx.orderPayment.aggregate({
        where: { orderId },
        _sum: { amount: true },
      });
      const remaining = Math.max(0, order.total - data.amount - (paid._sum.amount ?? 0));
      const orderUpdate: Prisma.OrderUpdateInput = {
        dp: data.amount,
        dpProofUrl: data.proofUrl,
        remaining,
      };
      if (remaining === 0) orderUpdate.paymentStatus = "LUNAS";
      await tx.order.update({ where: { id: orderId }, data: orderUpdate });

      return { invoiceNumber: order.invoiceNumber, remaining };
    });

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/dashboard");
    emitLog(`Order ${result.invoiceNumber} payment 1 (DP) updated`, {
      actor,
      order_id: orderId,
      invoice_number: result.invoiceNumber,
      amount: data.amount,
      remaining: result.remaining,
      has_proof: Boolean(data.proofUrl),
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof UserInputError) return { ok: false, error: e.message };
    emitLog(`Order DP update failed`, { actor, order_id: orderId, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
}

export async function deleteOrderPayment(paymentId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  const actor = session?.user?.email ?? "unknown";

  try {
    const result = await db.$transaction(async (tx) => {
      const payment = await tx.orderPayment.findUnique({ where: { id: paymentId } });
      if (!payment) throw new UserInputError("Pembayaran tidak ditemukan");
      const order = await tx.order.findUnique({
        where: { id: payment.orderId },
        select: { id: true, invoiceNumber: true, total: true, dp: true, paymentStatus: true },
      });
      if (!order) throw new Error("Order tidak ditemukan");

      await tx.orderPayment.delete({ where: { id: paymentId } });

      const paid = await tx.orderPayment.aggregate({
        where: { orderId: order.id },
        _sum: { amount: true },
      });
      const remaining = Math.max(0, order.total - (order.dp ?? 0) - (paid._sum.amount ?? 0));
      const orderUpdate: Prisma.OrderUpdateInput = { remaining };
      if (remaining > 0 && order.paymentStatus === "LUNAS") {
        orderUpdate.paymentStatus = "NO_PAYMENT";
      }
      await tx.order.update({ where: { id: order.id }, data: orderUpdate });

      return { invoiceNumber: order.invoiceNumber, amount: payment.amount, remaining };
    });

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/dashboard");
    emitLog(`Order ${result.invoiceNumber} payment deleted`, {
      actor,
      invoice_number: result.invoiceNumber,
      payment_id: paymentId,
      amount: result.amount,
      remaining: result.remaining,
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof UserInputError) return { ok: false, error: e.message };
    emitLog(`Order payment ${paymentId} delete failed`, { actor, payment_id: paymentId, error: String(e) }, SeverityNumber.ERROR);
    throw e;
  }
}