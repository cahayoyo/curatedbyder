import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    batch: { findMany: vi.fn() },
    book: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    toy: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    order: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    orderItem: { findMany: vi.fn(), groupBy: vi.fn() },
    bookBatchPrice: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/session", () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { id: "u1", role: "USER" } }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ set: vi.fn() }),
}));

vi.mock("@/lib/orderPdf", () => ({
  buildOrderPdf: vi.fn().mockReturnValue({ output: vi.fn(() => new ArrayBuffer(8)) }),
}));

vi.mock("@/lib/logo", () => ({ LOGO_BASE64: "" }));

vi.mock("next/server", () => {
  class NextResponse {
    body: unknown;
    init: ResponseInit;
    status: number;
    constructor(body: unknown, init: ResponseInit = {}) {
      this.body = body;
      this.init = init;
      this.status = init.status ?? 200;
    }
  }
  return { NextResponse, NextRequest: class {} };
});

vi.mock("@/components/BookForm", () => ({ BookForm: () => null }));
vi.mock("@/components/ToyForm", () => ({ ToyForm: () => null }));
vi.mock("@/components/OrderForm", () => ({ OrderForm: () => null }));
vi.mock("@/components/BuyerForm", () => ({ BuyerForm: () => null }));

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import AdminBooksPage from "@/app/admin/(panel)/books/page";
import AdminToysPage from "@/app/admin/(panel)/toys/page";
import AdminOrdersPage from "@/app/admin/(panel)/orders/page";
import AdminBuyersPage from "@/app/admin/(panel)/buyers/page";
import DashboardPage from "@/app/dashboard/page";
import EditBookPage from "@/app/admin/(panel)/books/[id]/edit/page";
import EditToyPage from "@/app/admin/(panel)/toys/[id]/edit/page";
import EditBuyerPage from "@/app/admin/(panel)/buyers/[id]/edit/page";
import EditOrderPage from "@/app/admin/(panel)/orders/[id]/edit/page";
import { GET as downloadOrder } from "@/app/api/download/orders/[id]/route";
import { customSignOut } from "@/server/actions/auth";
import type { NextRequest } from "next/server";

const bookMock = {
  id: "bk1",
  title: "Test Book",
  publisher: "Pub",
  info: "",
  image: "",
  price: 1000,
  stock: 5,
  status: "PRE_ORDER",
  formats: ["SOFTCOVER"],
  batchPrices: [{ batchId: "b1", price: 1000, formats: ["SOFTCOVER"] }],
};

const toyMock = {
  id: "ty1",
  title: "Test Toy",
  info: "",
  image: "",
  price: 2000,
  stock: 3,
  status: "READY",
  batchPrices: [{ batchId: "b1", price: 2000 }],
};

const orderMock = {
  id: "or1",
  invoiceNumber: "INV-1",
  buyerId: "u1",
  dp: 0,
  shippingCost: 0,
  trackingNumber: null,
  paymentStatus: "BELUM_LUNAS",
  items: [],
};

const batchList = [{ id: "b1", name: "Batch 1" }];

beforeEach(() => {
  vi.clearAllMocks();
  (db.batch.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(batchList);
  (db.user.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "u1",
    name: "Budi",
    phone: "0812",
    contact: "WA",
  });
  (db.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (db.book.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(bookMock);
  (db.book.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (db.toy.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(toyMock);
  (db.toy.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (db.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(orderMock);
  (db.bookBatchPrice.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
});

describe("async request APIs (Next.js 16)", () => {
  it("AdminBooksPage awaits searchParams", async () => {
    const el = await AdminBooksPage({ searchParams: Promise.resolve({}) });
    expect(el).toBeDefined();
  });

  it("AdminToysPage awaits searchParams", async () => {
    const el = await AdminToysPage({ searchParams: Promise.resolve({}) });
    expect(el).toBeDefined();
  });

  it("AdminOrdersPage awaits searchParams", async () => {
    const el = await AdminOrdersPage({ searchParams: Promise.resolve({}) });
    expect(el).toBeDefined();
  });

  it("AdminBuyersPage awaits searchParams", async () => {
    const el = await AdminBuyersPage({ searchParams: Promise.resolve({}) });
    expect(el).toBeDefined();
  });

  it("DashboardPage awaits searchParams", async () => {
    const el = await DashboardPage({ searchParams: Promise.resolve({}) });
    expect(el).toBeDefined();
  });

  it("EditBookPage awaits params", async () => {
    const el = await EditBookPage({ params: Promise.resolve({ id: "bk1" }) });
    expect(el).toBeDefined();
    expect(db.book.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "bk1" } })
    );
  });

  it("EditToyPage awaits params", async () => {
    const el = await EditToyPage({ params: Promise.resolve({ id: "ty1" }) });
    expect(el).toBeDefined();
    expect(db.toy.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "ty1" } })
    );
  });

  it("EditBuyerPage awaits params", async () => {
    const el = await EditBuyerPage({ params: Promise.resolve({ id: "u1" }) });
    expect(el).toBeDefined();
    expect(db.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u1" } })
    );
  });

  it("EditOrderPage awaits params", async () => {
    const el = await EditOrderPage({ params: Promise.resolve({ id: "or1" }) });
    expect(el).toBeDefined();
    expect(db.order.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "or1" } })
    );
  });

  it("order PDF route awaits params and returns PDF", async () => {
    const res = await downloadOrder({} as NextRequest, {
      params: Promise.resolve({ id: "abcdef12" }),
    });
    expect(res.status).toBe(200);
  });

  it("order PDF route rejects invalid id", async () => {
    const res = await downloadOrder({} as NextRequest, {
      params: Promise.resolve({ id: "bad id!" }),
    });
    expect(res.status).toBe(404);
  });

  it("order PDF route returns 404 for unknown order", async () => {
    (db.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await downloadOrder({} as NextRequest, {
      params: Promise.resolve({ id: "abcdef12" }),
    });
    expect(res.status).toBe(404);
  });

  it("customSignOut awaits cookies and clears session cookies", async () => {
    await customSignOut();
    const store = await (cookies as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(store.set).toHaveBeenCalledTimes(6);
  });
});
