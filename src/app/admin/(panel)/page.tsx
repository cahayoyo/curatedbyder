import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { formatIDR } from "@/lib/format";
import { getOverviewStats, type Delta } from "@/server/queries/overview";
import { requireAdmin } from "@/lib/session";
import { RangePicker, RangeProvider } from "./range-provider";
import { StatValue } from "./stat-value";
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
  ImageIcon,
  PackageCheck,
  PieChart,
  Plane,
  ReceiptText,
  ShoppingCart,
  Trophy,
  ToyBrick,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { STATUS_BADGE } from "@/lib/orderOptions";

const STEPS = [
  { key: "ORDER_PLACED", label: "Order Placed", dot: "bg-teal-500", icon: ClipboardList },
  { key: "SHIPPING_TO_INDONESIA", label: "Shipping to Indonesia", dot: "bg-sky-500", icon: Truck },
  { key: "ARRIVED_IN_INDONESIA", label: "Arrived in Indonesia", dot: "bg-indigo-500", icon: Plane },
  { key: "ARRIVED_AT_WAREHOUSE", label: "Arrived at Warehouse", dot: "bg-violet-500", icon: Warehouse },
  { key: "SHIPPED_TO_CUSTOMER", label: "Shipped to Customer", dot: "bg-orange-500", icon: PackageCheck },
  { key: "ORDER_DELIVERED", label: "Order Delivered", dot: "bg-emerald-500", icon: CheckCircle2 },
] as const;

const TONES = {
  rose: {
    card: "via-[#F9E4E4] to-[#F3CFCF]",
    chip: "bg-[#FBE6E6] text-[#C96A6A]",
  },
  green: {
    card: "via-[#E8F3EC] to-[#CFE7D8]",
    chip: "bg-[#E7F5EC] text-emerald-600",
  },
  violet: {
    card: "via-[#F8F0DC] to-[#F0E3BD]",
    chip: "bg-[#FAF0D7] text-amber-600",
  },
} as const;

type Tone = keyof typeof TONES;

const AVATAR_TONES = [
  "bg-[#FBE6E6] text-[#C96A6A]",
  "bg-sky-100 text-sky-600",
  "bg-violet-100 text-violet-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
] as const;

function buyerInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function BuyerAvatar({ name, index }: { name: string; index: number }) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
        AVATAR_TONES[index % AVATAR_TONES.length]
      )}
    >
      {buyerInitials(name)}
    </span>
  );
}

function ItemThumb({
  image,
  title,
  size,
}: {
  image: string | null;
  title: string;
  size: string;
}) {
  if (!image) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded border-2 border-dashed border-[#D97A7A]/50 bg-[#FED6D6]/20 text-[#D97A7A]/70",
          size
        )}
      >
        <ImageIcon className="h-3.5 w-3.5" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded border border-input bg-black/5",
        size
      )}
    >
      <Image src={image} alt={title} fill sizes="40px" className="object-cover object-center" />
    </div>
  );
}

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
          <StatValue value={value} className="text-2xl font-bold text-gray-900 md:text-3xl" />
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

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const r = Number(typeof params.r === "string" ? params.r : undefined);
  const range = r === 7 || r === 14 || r === 30 ? { days: r } : undefined;
  const [stats, session] = await Promise.all([getOverviewStats(range), requireAdmin()]);

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <RangeProvider>
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
        <div className="flex flex-nowrap items-stretch justify-between gap-3">
          <div className="flex w-fit items-center gap-3 rounded-xl bg-[#FBE6E6] px-5 py-3">
            <CalendarDays className="h-6 w-6 shrink-0 text-[#C96A6A]" />
            <div>
              <p className="text-sm font-bold text-[#B04A4A]">{dateLabel}</p>
              <p className="text-xs text-[#C96A6A]">
                Selamat Datang, {session?.user?.role === "SUPER_ADMIN" ? "Admin" : "Pengguna"}!
              </p>
            </div>
          </div>
          <RangePicker value={range?.days} />
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
        <div className="overflow-x-auto rounded-xl border border-[#F0CBCB]/60 bg-gradient-to-br from-white via-[#F9E4E4] to-[#F3CFCF] p-5 shadow-sm">
          <div className="relative flex min-w-[640px] justify-between">
            <span className="absolute left-[8%] right-[8%] top-[47px] h-0.5 bg-[#F0CBCB]" />
            {STEPS.map((step) => (
              <div
                key={step.key}
                className="relative z-10 flex flex-1 flex-col items-center gap-1.5"
              >
                <StatValue
                  value={stats.statusCount[step.key] ?? 0}
                  className="text-xl font-bold text-gray-900"
                />
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    step.dot
                  )}
                >
                  <step.icon className="h-4 w-4 text-white" />
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    STATUS_BADGE[step.key]
                  )}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top products + buyers */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[#F0CBCB]/60 bg-gradient-to-br from-white via-[#F9E4E4] to-[#F3CFCF] p-5 shadow-sm">
          <SectionHeading icon={Trophy} title="Buku Terlaris" href="/admin/books" linkLabel="Lihat semua" />
          {stats.topBooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada penjualan buku</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {stats.topBooks.map((book) => (
                <li key={book.id} className="flex items-center gap-2.5">
                  <ItemThumb image={book.image} title={book.title} size="h-10 w-8" />
                  <span className="min-w-0 flex-1 truncate text-gray-700">{book.title}</span>
                  <span className="shrink-0 font-medium whitespace-nowrap text-muted-foreground">
                    {book.sold} terjual
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-xl border border-[#F0CBCB]/60 bg-gradient-to-br from-white via-[#F9E4E4] to-[#F3CFCF] p-5 shadow-sm">
          <SectionHeading icon={ToyBrick} title="Mainan Terlaris" href="/admin/toys" linkLabel="Lihat semua" />
          {stats.topToys.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada penjualan mainan</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {stats.topToys.map((toy) => (
                <li key={toy.id} className="flex items-center gap-2.5">
                  <ItemThumb image={toy.image} title={toy.title} size="h-10 w-10" />
                  <span className="min-w-0 flex-1 truncate text-gray-700">{toy.title}</span>
                  <span className="shrink-0 font-medium whitespace-nowrap text-muted-foreground">
                    {toy.sold} terjual
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-xl border border-[#F0CBCB]/60 bg-gradient-to-br from-white via-[#F9E4E4] to-[#F3CFCF] p-5 shadow-sm">
          <SectionHeading icon={Users} title="Pembeli Terbanyak" href="/admin/buyers" linkLabel="Lihat semua" />
          {stats.topBuyers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {stats.topBuyers.map((buyer, i) => (
                <li key={buyer.id} className="flex items-center gap-2.5">
                  <BuyerAvatar name={buyer.name} index={i} />
                  <span className="min-w-0 flex-1 truncate text-gray-700">{buyer.name}</span>
                  <span className="shrink-0 font-medium whitespace-nowrap text-muted-foreground">
                    {buyer.transactions} transaksi
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
    </RangeProvider>
  );
}
