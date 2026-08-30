import { db } from "@/lib/db";
import { formatIDR } from "@/lib/format";
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  ReceiptText,
  ShoppingCart,
  PackageCheck,
  Users,
  BookOpen,
  TrendingUp,
  ToyBrick,
  Trophy,
} from "lucide-react";

const FULL_STATUSES = [
  "ORDER_PLACED",
  "SHIPPING_TO_INDONESIA",
  "ARRIVED_IN_INDONESIA",
  "ARRIVED_AT_WAREHOUSE",
  "SHIPPED_TO_CUSTOMER",
  "ORDER_DELIVERED",
] as const;

const STATUS_LABEL: Record<string, string> = {
  ORDER_PLACED: "Order Placed",
  SHIPPING_TO_INDONESIA: "Shipping to Indonesia",
  ARRIVED_IN_INDONESIA: "Arrived in Indonesia",
  ARRIVED_AT_WAREHOUSE: "Arrived at Warehouse",
  SHIPPED_TO_CUSTOMER: "Shipped to Customer",
  ORDER_DELIVERED: "Order Delivered",
};

export default async function AdminOverviewPage() {
  const [totalOrders, bookOrders, toyOrders, financial, byStatus, buyers, totalBooks, topBookItems, topToyItems, topBuyerCounts] =
    await Promise.all([
      db.order.count(),
      db.order.count({ where: { items: { some: { book: { isNot: null } } } } }),
      db.order.count({ where: { items: { some: { toy: { isNot: null } } } } }),
      db.order.aggregate({
        _sum: { total: true, dp: true, remaining: true },
      }),
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

  const statusCount = new Map(byStatus.map((s) => [s.status, s._count._all]));

  const topBookIds = topBookItems
    .map((b) => b.bookId)
    .filter((id): id is string => id !== null);
  const topBooks = topBookIds.length
    ? await db.book.findMany({ where: { id: { in: topBookIds } } })
    : [];
  const topBookMap = new Map(topBooks.map((b) => [b.id, b]));

  const topToyIds = topToyItems
    .map((t) => t.toyId)
    .filter((id): id is string => id !== null);
  const topToys = topToyIds.length
    ? await db.toy.findMany({ where: { id: { in: topToyIds } } })
    : [];
  const topToyMap = new Map(topToys.map((t) => [t.id, t]));

  const topBuyerIds = topBuyerCounts
    .map((b) => b.buyerId)
    .filter((id): id is string => id !== null);
  const topBuyers = topBuyerIds.length
    ? await db.user.findMany({ where: { id: { in: topBuyerIds } } })
    : [];
  const topBuyerMap = new Map(topBuyers.map((u) => [u.id, u]));

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <LayoutDashboard className="h-6 w-6" />
        Overview
      </h2>

      {/* Orders */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <ShoppingCart className="h-4 w-4" />
          Orders
        </p>

        {/* Total pesanan - full width */}
        <div className="rounded-lg border p-4 w-full">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            Total Pesanan
          </p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>

        {/* Buku / Mainan side by side */}
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              Pesanan Buku
            </p>
            <p className="text-2xl font-bold">{bookOrders}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ToyBrick className="h-4 w-4" />
              Pesanan Mainan
            </p>
            <p className="text-2xl font-bold">{toyOrders}</p>
          </div>
        </div>
      </div>

      {/* Financial */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <TrendingUp className="h-4 w-4" />
          Financial
        </p>

        {/* Total revenue - full width */}
        <div className="rounded-lg border p-4 w-full">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ReceiptText className="h-4 w-4" />
            Total Revenue
          </p>
          <p className="text-2xl font-bold">{formatIDR(financial._sum.total ?? 0)}</p>
        </div>

        {/* DP + Sisa Tagihan side by side */}
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Total DP
            </p>
            <p className="text-2xl font-bold">{formatIDR(financial._sum.dp ?? 0)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <PiggyBank className="h-4 w-4" />
              Total Sisa Tagihan
            </p>
            <p className="text-2xl font-bold">{formatIDR(financial._sum.remaining ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Operational */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <PackageCheck className="h-4 w-4" />
          Operational
        </p>
        <div className="rounded-lg border p-4">
          <ul className="space-y-1 text-sm">
            {FULL_STATUSES.map((s) => (
              <li key={s} className="flex justify-between">
                <span>{STATUS_LABEL[s]}</span>
                <span className="font-medium">{statusCount.get(s) ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Catalog */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <BookOpen className="h-4 w-4" />
          Catalog
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Total Pembeli
            </p>
            <p className="text-2xl font-bold">{buyers}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              Total Buku
            </p>
            <p className="text-2xl font-bold">{totalBooks}</p>
          </div>
        </div>
      </div>

      {/* Top 5 most-purchased books */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Trophy className="h-4 w-4" />
          Buku Terlaris
        </p>
        <div className="rounded-lg border p-4">
          {topBookItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada penjualan buku</p>
          ) : (
            <ol className="space-y-1 text-sm">
              {topBookItems.map((item, i) => {
                const book = item.bookId ? topBookMap.get(item.bookId) : undefined;
                if (!book) return null;
                return (
                  <li key={item.bookId} className="flex justify-between">
                    <span>
                      {i + 1}. {book.title}
                    </span>
                    <span className="font-medium">{item._sum.quantity ?? 0} terjual</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {/* Top 5 most-purchased toys */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <ToyBrick className="h-4 w-4" />
          Mainan Terlaris
        </p>
        <div className="rounded-lg border p-4">
          {topToyItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada penjualan mainan</p>
          ) : (
            <ol className="space-y-1 text-sm">
              {topToyItems.map((item, i) => {
                const toy = item.toyId ? topToyMap.get(item.toyId) : undefined;
                if (!toy) return null;
                return (
                  <li key={item.toyId} className="flex justify-between">
                    <span>
                      {i + 1}. {toy.title}
                    </span>
                    <span className="font-medium">{item._sum.quantity ?? 0} terjual</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {/* Top 5 buyers by transaction count */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Users className="h-4 w-4" />
          Pembeli Transaksi Terbanyak
        </p>
        <div className="rounded-lg border p-4">
          {topBuyerCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada transaksi pembeli</p>
          ) : (
            <ol className="space-y-1 text-sm">
              {topBuyerCounts.map((b, i) => {
                const user = b.buyerId ? topBuyerMap.get(b.buyerId) : undefined;
                if (!user) return null;
                return (
                  <li key={b.buyerId} className="flex justify-between">
                    <span className="truncate pr-4">{i + 1}. {user.name}</span>
                    <span className="font-medium">{b._count.buyerId} transaksi</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}