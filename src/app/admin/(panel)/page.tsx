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
  const [totalOrders, financial, byStatus, buyers, totalBooks] = await Promise.all([
    db.order.count(),
    db.order.aggregate({
      _sum: { total: true, dp: true, remaining: true },
    }),
    db.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.user.count({ where: { role: "USER" } }),
    db.book.count(),
  ]);

  const statusCount = new Map(byStatus.map((s) => [s.status, s._count._all]));

  const financialCards = [
    {
      label: "Total Pesanan",
      value: String(totalOrders),
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      label: "Total Revenue",
      value: formatIDR(financial._sum.total ?? 0),
      icon: <ReceiptText className="h-4 w-4" />,
    },
    {
      label: "Total DP",
      value: formatIDR(financial._sum.dp ?? 0),
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: "Total Remaining Payment",
      value: formatIDR(financial._sum.remaining ?? 0),
      icon: <PiggyBank className="h-4 w-4" />,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <LayoutDashboard className="h-6 w-6" />
        Overview
      </h2>

      {/* Financial */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <TrendingUp className="h-4 w-4" />
          Financial
        </p>
        <div className="grid grid-cols-2 gap-4">
          {financialCards.map((r) => (
            <div key={r.label} className="rounded-lg border p-4">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {r.icon}
                {r.label}
              </p>
              <p className="text-2xl font-bold">{r.value}</p>
            </div>
          ))}
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