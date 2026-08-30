import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminOverviewPage from "./page";

vi.mock("@/lib/db", () => ({
  db: {
    order: {
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    orderItem: {
      groupBy: vi.fn(),
    },
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    book: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    toy: {
      findMany: vi.fn(),
    },
  },
}));

const { db } = await import("@/lib/db");

beforeEach(() => {
  vi.clearAllMocks();
  (db.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(10);
  (db.order.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
    _sum: { total: 500000, dp: 100000, remaining: 400000 },
  });
  (db.order.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
    { buyerId: "u1", _count: { buyerId: 3 } },
    { buyerId: "u2", _count: { buyerId: 2 } },
  ]);
  (db.orderItem.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (db.user.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);
  (db.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
    { id: "u1", name: "Budi Santoso" },
    { id: "u2", name: "Siti Aminah" },
  ]);
  (db.book.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
  (db.book.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (db.toy.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
});

async function renderPage() {
  return renderToStaticMarkup(await AdminOverviewPage());
}

describe("AdminOverviewPage", () => {
  it("renders top buyers section with names and transaction counts", async () => {
    const html = await renderPage();
    expect(html).toContain("Pembeli Transaksi Terbanyak");
    expect(html).toContain("Budi Santoso");
    expect(html).toContain("3 transaksi");
    expect(html).toContain("Siti Aminah");
    expect(html).toContain("2 transaksi");
  });

  it("renders empty state when there are no buyer transactions", async () => {
    (db.order.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const html = await renderPage();
    expect(html).toContain("Pembeli Transaksi Terbanyak");
    expect(html).toContain("Belum ada transaksi pembeli");
  });
});