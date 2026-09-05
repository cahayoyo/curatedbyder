import { db } from "@/lib/db";

export type Delta = {
  current: number;
  previous: number;
  percentChange: number | null;
};

export type TopItem = { id: string; title: string; sold: number };
export type TopBuyer = { id: string; name: string; transactions: number };

export type OverviewStats = {
  totalOrders: number;
  bookOrders: number;
  toyOrders: number;
  revenue: number;
  totalDp: number;
  totalRemaining: number;
  orderDeltas: { total: Delta; book: Delta; toy: Delta };
  financialDeltas: { revenue: Delta; dp: Delta; remaining: Delta };
  statusCount: Record<string, number>;
  buyers: number;
  totalBooks: number;
  topBooks: TopItem[];
  topToys: TopItem[];
  topBuyers: TopBuyer[];
};

function monthStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

// ponytail: setUTCMonth rolls over on month-end dates (Jan 31 -> Mar 3); clamp explicitly if a boundary month matters
function addMonths(d: Date, n: number) {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + n);
  return r;
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function delta(current: number, previous: number): Delta {
  return { current, previous, percentChange: percentChange(current, previous) };
}

const BOOK_ITEMS = { items: { some: { book: { isNot: null } } } };
const TOY_ITEMS = { items: { some: { toy: { isNot: null } } } };
const FINANCIAL_SUM = { total: true, dp: true, remaining: true } as const;

export async function getOverviewStats(): Promise<OverviewStats> {
  const now = new Date();
  const curStart = monthStart(now);
  const prevStart = monthStart(addMonths(now, -1));
  const prevEnd = addMonths(now, -1); // same span as month-to-date
  const soldAt = (from: Date, to: Date) => ({ soldAt: { gte: from, lt: to } });

  const [totalOrders, bookOrders, toyOrders, financial, curMonth, prevMonth, byStatus, buyers, totalBooks, topBookItems, topToyItems, topBuyerCounts] =
    await Promise.all([
      db.order.count(),
      db.order.count({ where: BOOK_ITEMS }),
      db.order.count({ where: TOY_ITEMS }),
      db.order.aggregate({ _sum: { ...FINANCIAL_SUM } }),
      Promise.all([
        db.order.count({ where: soldAt(curStart, now) }),
        db.order.count({ where: { ...soldAt(curStart, now), ...BOOK_ITEMS } }),
        db.order.count({ where: { ...soldAt(curStart, now), ...TOY_ITEMS } }),
        db.order.aggregate({ _sum: { ...FINANCIAL_SUM }, where: soldAt(curStart, now) }),
      ]),
      Promise.all([
        db.order.count({ where: soldAt(prevStart, prevEnd) }),
        db.order.count({ where: { ...soldAt(prevStart, prevEnd), ...BOOK_ITEMS } }),
        db.order.count({ where: { ...soldAt(prevStart, prevEnd), ...TOY_ITEMS } }),
        db.order.aggregate({ _sum: { ...FINANCIAL_SUM }, where: soldAt(prevStart, prevEnd) }),
      ]),
      db.orderItem.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.user.count({ where: { role: "USER" } }),
      db.book.count(),
      db.orderItem.groupBy({
        by: ["bookId"],
        where: { bookId: { not: null } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      db.orderItem.groupBy({
        by: ["toyId"],
        where: { toyId: { not: null } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      db.order.groupBy({
        by: ["buyerId"],
        _count: { buyerId: true },
        orderBy: { _count: { buyerId: "desc" } },
        take: 5,
      }),
    ]);

  const [cTotal, cBook, cToy, cFin] = curMonth;
  const [pTotal, pBook, pToy, pFin] = prevMonth;

  const topBookIds = topBookItems.map((b) => b.bookId).filter((id): id is string => id !== null);
  const bookRows = topBookIds.length ? await db.book.findMany({ where: { id: { in: topBookIds } } }) : [];
  const bookMap = new Map(bookRows.map((b) => [b.id, b]));

  const topToyIds = topToyItems.map((t) => t.toyId).filter((id): id is string => id !== null);
  const toyRows = topToyIds.length ? await db.toy.findMany({ where: { id: { in: topToyIds } } }) : [];
  const toyMap = new Map(toyRows.map((t) => [t.id, t]));

  const topBuyerIds = topBuyerCounts.map((b) => b.buyerId).filter((id): id is string => id !== null);
  const buyerRows = topBuyerIds.length ? await db.user.findMany({ where: { id: { in: topBuyerIds } } }) : [];
  const buyerMap = new Map(buyerRows.map((u) => [u.id, u]));

  return {
    totalOrders,
    bookOrders,
    toyOrders,
    revenue: financial._sum.total ?? 0,
    totalDp: financial._sum.dp ?? 0,
    totalRemaining: financial._sum.remaining ?? 0,
    orderDeltas: {
      total: delta(cTotal, pTotal),
      book: delta(cBook, pBook),
      toy: delta(cToy, pToy),
    },
    financialDeltas: {
      revenue: delta(cFin._sum.total ?? 0, pFin._sum.total ?? 0),
      dp: delta(cFin._sum.dp ?? 0, pFin._sum.dp ?? 0),
      remaining: delta(cFin._sum.remaining ?? 0, pFin._sum.remaining ?? 0),
    },
    statusCount: Object.fromEntries(byStatus.map((s) => [s.status as string, s._count._all])),
    buyers,
    totalBooks,
    topBooks: topBookItems.flatMap((it) => {
      const book = it.bookId ? bookMap.get(it.bookId) : undefined;
      return book ? [{ id: book.id, title: book.title, sold: it._sum.quantity ?? 0 }] : [];
    }),
    topToys: topToyItems.flatMap((it) => {
      const toy = it.toyId ? toyMap.get(it.toyId) : undefined;
      return toy ? [{ id: toy.id, title: toy.title, sold: it._sum.quantity ?? 0 }] : [];
    }),
    topBuyers: topBuyerCounts.flatMap((b) => {
      const user = b.buyerId ? buyerMap.get(b.buyerId) : undefined;
      return user ? [{ id: user.id, name: user.name, transactions: b._count.buyerId }] : [];
    }),
  };
}
