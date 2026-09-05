import Link from "next/link";
import { connection } from "next/server";
import { formatIDR } from "@/lib/format";
import { getOverviewStats, type Delta } from "@/server/queries/overview";
import { requireAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gift,
  LayoutDashboard,
  PackageCheck,
  PieChart,
  Plane,
  ReceiptText,
  ShoppingCart,
  Truck,
  Trophy,
  ToyBrick,
  TrendingUp,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  ORDER_PLACED: "Order Placed",
  SHIPPING_TO_INDONESIA: "Shipping to Indonesia",
  ARRIVED_IN_INDONESIA: "Arrived in Indonesia",
  ARRIVED_AT_WAREHOUSE: "Arrived at Warehouse",
  SHIPPED_TO_CUSTOMER: "Shipped to Customer",
  ORDER_DELIVERED: "Order Delivered",
};

const STATUS_ICON: Record<string, LucideIcon> = {
  ORDER_PLACED: ClipboardList,
  SHIPPING_TO_INDONESIA: Truck,
  ARRIVED_IN_INDONESIA: Plane,
  ARRIVED_AT_WAREHOUSE: Warehouse,
  SHIPPED_TO_CUSTOMER: PackageCheck,
  ORDER_DELIVERED: CheckCircle2,
};

const TONES = {
  rose: {
    card: "via-[#FCF3F3] to-[#F9E3E3]",
    chip: "bg-[#FBE6E6] text-[#C96A6A]",
  },
  green: {
    card: "via-[#F0F8F3] to-[#E2F1E8]",
    chip: "bg-[#E7F5EC] text-emerald-600",
  },
  violet: {
    card: "via-[#F4F1FB] to-[#E9E3F8]",
    chip: "bg-[#EFEAFB] text-violet-600",
  },
} as const;

type Tone = keyof typeof TONES;

function DeltaLine({ delta }: { delta: Delta }) {
  if (delta.percentChange == null) return null;
  const up = delta.percentChange >= 0;
  return (
    <p
      className={cn(
        "mt-0.5 flex items-center gap-1 text-xs font-medium",
        up ? "text-emerald-600" : "text-red-500"
      )}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {delta.percentChange}% dari bulan lalu
    </p>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  tone = "rose",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta: Delta;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#F0CBCB]/60 bg-gradient-to-br from-white p-5 shadow-sm",
        TONES[tone].card
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            TONES[tone].chip
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-gray-900 md:text-3xl">{value}</p>
          <DeltaLine delta={delta} />
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  href,
  linkLabel = "Lihat detail",
}: {
  icon: LucideIcon;
  title: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
        <Icon className="h-5 w-5 text-[#C96A6A]" />
        {title}
      </h2>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-1 text-sm font-medium text-[#C96A6A] transition-colors hover:text-[#B04A4A]"
      >
        {linkLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default async function AdminOverviewPage() {
  await connection();
  const [stats, session] = await Promise.all([getOverviewStats(), requireAdmin()]);

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const statuses = Object.keys(STATUS_LABEL);
  const statusesLeft = statuses.slice(0, 3);
  const statusesRight = statuses.slice(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <LayoutDashboard className="mt-1.5 h-7 w-7 shrink-0 text-[#C96A6A]" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
            <p className="text-sm text-muted-foreground">
              Ringkasan Aktivitas CuratedByDer.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-[#FBE6E6] px-5 py-3">
          <CalendarDays className="h-6 w-6 shrink-0 text-[#C96A6A]" />
          <div>
            <p className="text-sm font-bold text-[#B04A4A]">{dateLabel}</p>
            <p className="text-xs text-[#C96A6A]">Selamat bekerja, {session?.user?.name ?? "Admin"}!</p>
          </div>
        </div>
      </div>

      {/* Orders */}
      <section>
        <SectionHeading icon={ShoppingCart} title="Orders" href="/admin/orders" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            icon={ShoppingCart}
            label="Total Pesanan"
            value={stats.totalOrders}
            delta={stats.orderDeltas.total}
          />
          <StatCard
            icon={BookOpen}
            label="Pesanan Buku"
            value={stats.bookOrders}
            delta={stats.orderDeltas.book}
          />
          <StatCard
            icon={Gift}
            label="Pesanan Mainan"
            value={stats.toyOrders}
            delta={stats.orderDeltas.toy}
          />
        </div>
      </section>

      {/* Financial */}
      <section>
        <SectionHeading icon={TrendingUp} title="Financial" href="/admin/orders" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            icon={ReceiptText}
            label="Total Revenue"
            value={formatIDR(stats.revenue)}
            delta={stats.financialDeltas.revenue}
            tone="green"
          />
          <StatCard
            icon={Wallet}
            label="Total DP"
            value={formatIDR(stats.totalDp)}
            delta={stats.financialDeltas.dp}
          />
          <StatCard
            icon={PieChart}
            label="Total Sisa Tagihan"
            value={formatIDR(stats.totalRemaining)}
            delta={stats.financialDeltas.remaining}
            tone="violet"
          />
        </div>
      </section>

      {/* Operational */}
      <section>
        <SectionHeading icon={PackageCheck} title="Operational" href="/admin/orders" />
        <div className="grid grid-cols-1 gap-6 rounded-xl border border-[#F0CBCB]/60 bg-white p-5 shadow-sm md:grid-cols-2 md:gap-0">
          {[statusesLeft, statusesRight].map((group, col) => (
            <ul
              key={col}
              className={cn(
                "space-y-4",
                col === 1 && "md:border-l md:border-[#F0CBCB]/60 md:pl-8"
              )}
            >
              {group.map((s) => {
                const Icon = STATUS_ICON[s];
                return (
                  <li key={s} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FDF1F1] text-[#C96A6A]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="flex-1 text-sm text-gray-700">{STATUS_LABEL[s]}</span>
                    <span className="text-sm font-bold text-gray-900">{stats.statusCount[s] ?? 0}</span>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </section>

      {/* Catalog + Top products */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[#F0CBCB]/60 bg-white p-5 shadow-sm">
          <SectionHeading icon={BookOpen} title="Catalog" href="/admin/books" linkLabel="Lihat semua" />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-[#FDF1F1] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBE6E6] text-[#C96A6A]">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">Total Pembeli</p>
                <p className="text-xl font-bold text-gray-900">{stats.buyers}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-[#FDF1F1] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBE6E6] text-[#C96A6A]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">Total Buku</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalBooks}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#F0CBCB]/60 bg-white p-5 shadow-sm">
          <SectionHeading icon={Trophy} title="Buku Terlaris" href="/admin/books" linkLabel="Lihat semua" />
          {stats.topBooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada penjualan buku</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {stats.topBooks.map((book, i) => (
                <li key={book.id} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate text-gray-700">
                    {i + 1}. {book.title}
                  </span>
                  <span className="shrink-0 font-medium whitespace-nowrap text-muted-foreground">
                    {book.sold} terjual
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-xl border border-[#F0CBCB]/60 bg-white p-5 shadow-sm">
          <SectionHeading icon={ToyBrick} title="Mainan Terlaris" href="/admin/toys" linkLabel="Lihat semua" />
          {stats.topToys.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada penjualan mainan</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {stats.topToys.map((toy, i) => (
                <li key={toy.id} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate text-gray-700">
                    {i + 1}. {toy.title}
                  </span>
                  <span className="shrink-0 font-medium whitespace-nowrap text-muted-foreground">
                    {toy.sold} terjual
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between gap-1 border-t border-[#F0CBCB]/60 pt-4 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} CuratedByDer. All rights reserved.</p>
        <p className="flex items-center gap-2">
          Books • Stories • To You
          <span className="hidden h-px w-16 bg-[#D97A7A] sm:inline-block" />
        </p>
      </footer>
    </div>
  );
}
