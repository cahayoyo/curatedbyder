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
  const [totalOrders, bookOrders, toyOrders, financial, byStatus, buyers, totalBooks] =
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
    ]);

  const statusCount = new Map(byStatus.map((s) => [s.status, s._count._all]));

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
    </div>
  );
}