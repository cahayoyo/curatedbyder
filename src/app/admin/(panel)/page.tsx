import { formatIDR } from "@/lib/format";
import { getOverviewStats } from "@/server/queries/overview";
import { connection } from "next/server";
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
  await connection();
  const stats = await getOverviewStats();
  const { totalOrders, bookOrders, toyOrders, statusCount } = stats;

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
          <p className="text-lg font-bold break-words md:text-2xl">{formatIDR(stats.revenue)}</p>
        </div>

        {/* DP + Sisa Tagihan side by side */}
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Total DP
            </p>
            <p className="text-lg font-bold break-words md:text-2xl">{formatIDR(stats.totalDp)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <PiggyBank className="h-4 w-4" />
              Total Sisa Tagihan
            </p>
            <p className="text-lg font-bold break-words md:text-2xl">{formatIDR(stats.totalRemaining)}</p>
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
                <span className="font-medium">{statusCount[s] ?? 0}</span>
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
            <p className="text-2xl font-bold">{stats.buyers}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              Total Buku
            </p>
            <p className="text-2xl font-bold">{stats.totalBooks}</p>
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
          {stats.topBooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada penjualan buku</p>
          ) : (
            <ol className="space-y-1 text-sm">
              {stats.topBooks.map((book, i) => (
                <li key={book.id} className="flex justify-between">
                  <span className="min-w-0">
                    {i + 1}. {book.title}
                  </span>
                  <span className="shrink-0 font-medium whitespace-nowrap">{book.sold} terjual</span>
                </li>
              ))}
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
          {stats.topToys.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada penjualan mainan</p>
          ) : (
            <ol className="space-y-1 text-sm">
              {stats.topToys.map((toy, i) => (
                <li key={toy.id} className="flex justify-between">
                  <span className="min-w-0">
                    {i + 1}. {toy.title}
                  </span>
                  <span className="shrink-0 font-medium whitespace-nowrap">{toy.sold} terjual</span>
                </li>
              ))}
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
          {stats.topBuyers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada transaksi pembeli</p>
          ) : (
            <ol className="space-y-1 text-sm">
              {stats.topBuyers.map((buyer, i) => (
                <li key={buyer.id} className="flex justify-between">
                  <span className="min-w-0 truncate pr-4">{i + 1}. {buyer.name}</span>
                  <span className="shrink-0 font-medium whitespace-nowrap">{buyer.transactions} transaksi</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
