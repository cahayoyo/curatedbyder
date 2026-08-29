import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { createOrder } from "./orders";

const requireAdmin = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({ requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath }));

const tx = {
  book: {
    findMany: vi.fn(),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
  },
  toy: {
    findMany: vi.fn(),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
  },
  bookBatchPrice: { findMany: vi.fn().mockResolvedValue([]) },
  order: {
    aggregate: vi.fn().mockResolvedValue({ _max: { invoiceNumber: null } }),
    create: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  db: { $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(tx)) },
}));

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    buyerId: "buyer1",
    paymentStatus: "LUNAS",
    items: [
      {
        bookId: "b1",
        batchId: "bt1",
        eta: "JAN",
        quantity: 2,
        unitPrice: 10000,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  tx.book.findMany.mockResolvedValue([
    { id: "b1", title: "Buku A", price: 10000, stock: 5 },
  ]);
  tx.toy.findMany.mockResolvedValue([]);
  tx.bookBatchPrice.findMany.mockResolvedValue([]);
  tx.order.aggregate.mockResolvedValue({ _max: { invoiceNumber: null } });
  tx.order.create.mockResolvedValue({ id: "o1", invoiceNumber: "INVDER-X" });
});

describe("createOrder", () => {
  it("creates the order, applies stock decrement, and revalidates paths", async () => {
    const result = await createOrder(
      baseInput({ dp: 5000, shippingCost: 2000 }) as Parameters<typeof createOrder>[0]
    );

    expect(result.ok).toBe(true);
    expect(tx.order.create).toHaveBeenCalledTimes(1);
    expect(tx.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        buyerId: "buyer1",
        total: 22000,
        dp: 5000,
        remaining: 17000,
        shippingCost: 2000,
        paymentStatus: "LUNAS",
      }),
    });
    const invoice = tx.order.create.mock.calls[0][0].data.invoiceNumber;
    expect(invoice).toMatch(/^INVDER-\d{8}-0001$/);
    expect(tx.book.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["b1"] } },
      data: { stock: { decrement: 2 } },
    });
    expect(tx.toy.updateMany).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders");
  });

  it("rejects items without a book or toy id (zod refinement)", async () => {
    await expect(
      createOrder(
        baseInput({
          items: [{ batchId: "bt1", eta: "JAN", quantity: 1, unitPrice: 10000 }],
        }) as Parameters<typeof createOrder>[0]
      )
    ).rejects.toThrow(/buku atau mainan/);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("rejects empty item lists (zod min)", async () => {
    await expect(
      createOrder(baseInput({ items: [] }) as Parameters<typeof createOrder>[0])
    ).rejects.toThrow();
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("returns an ActionResult failure when a unit price is missing", async () => {
    const result = await createOrder(
      baseInput({
        items: [{ bookId: "b1", batchId: "bt1", eta: "JAN", quantity: 1 }],
      }) as Parameters<typeof createOrder>[0]
    );

    expect(result).toEqual({ ok: false, error: "Harga wajib diisi untuk setiap item" });
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("returns an ActionResult failure when stock is insufficient", async () => {
    tx.book.findMany.mockResolvedValue([
      { id: "b1", title: "Buku A", price: 10000, stock: 1 },
    ]);

    const result = await createOrder(
      baseInput({ items: [{ bookId: "b1", batchId: "bt1", eta: "JAN", quantity: 2, unitPrice: 10000 }] }) as Parameters<
        typeof createOrder
      >[0]
    );

    expect(result).toEqual({ ok: false, error: "Not enough stock for Buku A" });
    expect(tx.order.create).not.toHaveBeenCalled();
    expect(tx.book.updateMany).not.toHaveBeenCalled();
  });

  it("retries once on an invoice-number collision (P2002) and bumps the sequence", async () => {
    tx.order.create
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("unique constraint", {
          code: "P2002",
          clientVersion: "test",
          meta: { target: ["invoiceNumber"] },
        })
      )
      .mockResolvedValueOnce({ id: "o2", invoiceNumber: "INVDER-Y" });

    const result = await createOrder(baseInput() as Parameters<typeof createOrder>[0]);

    expect(result.ok).toBe(true);
    expect(tx.order.create).toHaveBeenCalledTimes(2);
    const secondInvoice = tx.order.create.mock.calls[1][0].data.invoiceNumber;
    expect(secondInvoice).toMatch(/-0002$/);
  });

  it("rethrows non-P2002 transaction errors", async () => {
    tx.order.create.mockRejectedValue(new Error("db down"));

    await expect(
      createOrder(baseInput() as Parameters<typeof createOrder>[0])
    ).rejects.toThrow("db down");
  });
});
