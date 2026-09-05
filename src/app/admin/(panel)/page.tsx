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
  Blocks,
  FileText,
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
    chip: "bg-[#F5CACA] text-[#A84040]",
    wave: "#D97A7A",
  },
  green: {
    card: "via-[#E8F3EC] to-[#CFE7D8]",
    chip: "bg-[#CDEBDA] text-emerald-700",
    wave: "#6FBD8E",
  },
  violet: {
    card: "via-[#F8F0DC] to-[#F0E3BD]",
    chip: "bg-[#F3E3B8] text-amber-700",
    wave: "#DFB560",
  },
  blue: {
    card: "via-[#E4EEF7] to-[#CFE2F0]",
    chip: "bg-[#CBE2F5] text-sky-700",
    wave: "#7FB5E6",
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

const FIN_COLORS = { revenue: "#7FC49A", dp: "#7FB5E6", remaining: "#F6D88C" };

function FinancialDonut({
  revenue,
  dp,
  remaining,
}: {
  revenue: number;
  dp: number;
  remaining: number;
}) {
  const R = 78;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segs = [
    { value: dp, color: FIN_COLORS.dp },
    { value: remaining, color: FIN_COLORS.remaining },
  ]
    .filter((p) => revenue > 0 && p.value > 0)
    .map((p) => {
      const len = (p.value / revenue) * C;
      const seg = { ...p, len, start: acc };
      acc += len;
      return seg;
    });
  return (
    <svg viewBox="0 0 200 200" className="h-44 w-44 shrink-0 lg:h-52 lg:w-52">
      <circle cx="100" cy="100" r={R} fill="none" stroke="#F6E8E8" strokeWidth="40" />
      {segs.map((s) => (
        <circle
          key={s.color}
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke={s.color}
          strokeWidth="40"
          strokeDasharray={`${s.len} ${C - s.len}`}
          strokeDashoffset={-s.start}
          transform="rotate(-90 100 100)"
        />
      ))}
      {segs.map((s) => {
        const mid = ((s.start + s.len / 2) / C) * 2 * Math.PI - Math.PI / 2;
        return (
          <text
            key={s.color}
            x={100 + R * Math.cos(mid)}
            y={100 + R * Math.sin(mid)}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-gray-900 text-xs font-bold"
          >
            {Math.round((s.value / revenue) * 100)}%
          </text>
        );
      })}
      <text
        x="100"
        y="94"
        textAnchor="middle"
        className="fill-gray-900 text-sm font-bold"
      >
        {formatIDR(revenue)}
      </text>
      <text x="100" y="112" textAnchor="middle" className="fill-gray-500 text-[10px]">
        Total Transaksi
      </text>
    </svg>
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
        "relative shrink-0 overflow-hidden rounded bg-black/5",
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

function MiniBars() {
  const heights = ["h-4", "h-7", "h-5", "h-9", "h-11", "h-6"];
  return (
    <div
      className="ml-auto hidden shrink-0 items-end gap-1.5 pr-1 md:flex"
      aria-hidden
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-2.5 rounded-full bg-gradient-to-t from-[#D97A7A]/50 to-[#D97A7A]/10",
            h
          )}
        />
      ))}
    </div>
  );
}

function MiniWave({
  stroke,
  hideOnMobile,
}: {
  stroke: string;
  hideOnMobile?: boolean;
}) {
  const line = "M2 32 C10 22 16 34 24 26 C32 18 36 30 44 20 C52 10 58 18 62 8";
  return (
    <svg
      viewBox="0 0 64 40"
      className={cn("ml-auto h-10 w-16 shrink-0", hideOnMobile && "hidden md:block")}
      aria-hidden
      fill="none"
    >
      <path d={`${line} L62 40 L2 40 Z`} fill={stroke} opacity="0.18" stroke="none" />
      <path d={line} stroke={stroke} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  tone = "rose",
  decor,
  compact,
  className,
  valueClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta: Delta;
  tone?: Tone;
  decor?: "bars" | "wave" | "wave-desktop";
  compact?: boolean;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#F0CBCB]/60 bg-gradient-to-br from-white shadow-sm",
        TONES[tone].card,
        compact ? "p-3 md:p-5" : "p-5",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-4",
          compact && "flex-col gap-2 text-center md:flex-row md:gap-4 md:text-left"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            TONES[tone].chip,
            compact ? "h-10 w-10 md:h-12 md:w-12" : "h-12 w-12"
          )}
        >
          <Icon className={cn("h-6 w-6", compact && "h-5 w-5 md:h-6 md:w-6")} />
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-sm text-muted-foreground",
              compact && "text-xs md:text-sm"
            )}
          >
            {label}
          </p>
          <StatValue
            value={value}
            className={valueClassName ?? "text-2xl font-bold text-gray-900 md:text-3xl"}
          />
          <DeltaLine delta={delta} />
        </div>
        {decor === "bars" && <MiniBars />}
        {(decor === "wave" || decor === "wave-desktop") && (
          <MiniWave stroke={TONES[tone].wave} hideOnMobile={decor === "wave-desktop"} />
        )}
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
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <StatCard
            icon={FileText}
            label="Total Invoice"
            decor="bars"
            compact
            value={stats.totalOrders}
            delta={stats.orderDeltas.total}
          />
          <StatCard
            icon={BookOpen}
            label="Pesanan Buku"
            decor="bars"
            compact
            value={stats.bookOrders}
            delta={stats.orderDeltas.book}
          />
          <StatCard
            icon={Blocks}
            label="Pesanan Mainan"
            decor="bars"
            compact
            value={stats.toyOrders}
            delta={stats.orderDeltas.toy}
          />
        </div>
      </section>

      {/* Financial */}
      <section>
        <SectionHeading
          icon={TrendingUp}
          title="Financial"
          href="/admin/orders"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col items-center gap-6 rounded-xl border border-[#F0CBCB]/60 bg-gradient-to-br from-[#FCF7EC] via-[#FDF2F0] to-[#FBE3E3] p-5 shadow-sm lg:flex-row">
            <FinancialDonut
              revenue={stats.revenue}
              dp={stats.totalDp}
              remaining={stats.totalRemaining}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-gray-900">Distribusi Keuangan</h3>
              <p className="text-sm text-muted-foreground">
                Proporsi revenue, DP, dan sisa tagihan.
              </p>
              <ul className="mt-4 space-y-3">
                {(
                  [
                    { name: "Revenue", desc: "Total nilai semua transaksi", value: stats.revenue, color: FIN_COLORS.revenue, pct: false },
                    { name: "DP (Uang Muka)", desc: "Uang muka yang sudah diterima", value: stats.totalDp, color: FIN_COLORS.dp, pct: true },
                    { name: "Sisa Tagihan", desc: "Menunggu pelunasan pembeli", value: stats.totalRemaining, color: FIN_COLORS.remaining, pct: true },
                  ] as const
                ).map((row) => {
                  return (
                    <li key={row.name} className="flex items-center gap-3">
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{ background: row.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {row.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{row.desc}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-gray-900">{formatIDR(row.value)}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.pct
                            ? `${stats.revenue ? Math.round((row.value / stats.revenue) * 100) : 0}%`
                            : "\u00A0"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-1">
            <StatCard
              icon={ReceiptText}
              label="Total Revenue"
              value={formatIDR(stats.revenue)}
              delta={stats.financialDeltas.revenue}
              tone="green"
              decor="wave"
              className="col-span-2"
            />
            <StatCard
              icon={Wallet}
              label="Total DP"
              value={formatIDR(stats.totalDp)}
              delta={stats.financialDeltas.dp}
              tone="blue"
              decor="wave-desktop"
              className="p-4 md:p-5"
              valueClassName="text-lg font-bold text-gray-900 md:text-2xl lg:text-3xl"
            />
            <StatCard
              icon={PieChart}
              label="Total Sisa Tagihan"
              value={formatIDR(stats.totalRemaining)}
              delta={stats.financialDeltas.remaining}
              tone="violet"
              decor="wave-desktop"
              className="p-4 md:p-5"
              valueClassName="text-lg font-bold text-gray-900 md:text-2xl lg:text-3xl"
            />
          </div>
        </div>
      </section>

      {/* Operational */}
      <section>
        <SectionHeading icon={PackageCheck} title="Operational" href="/admin/orders" />
        <div className="overflow-x-auto rounded-xl border border-[#F0CBCB]/60 bg-gradient-to-br from-white via-[#F9E4E4] to-[#F3CFCF] p-5 shadow-sm">
          <div className="relative grid grid-cols-3 gap-y-5 md:flex md:min-w-[640px] md:justify-between">
            <span className="absolute left-[8%] right-[8%] top-[47px] hidden h-0.5 bg-[#DFA6A6] md:block" />
            {STEPS.map((step, i) => (
              <div
                key={step.key}
                className={cn(
                  "relative z-10 flex flex-1 flex-col items-center gap-1.5",
                  i === 3 && "order-6 md:order-none",
                  i === 4 && "order-5 md:order-none",
                  i === 5 && "order-4 md:order-none"
                )}
              >
                <span
                  className={cn(
                    "absolute top-[47px] h-0.5 bg-[#DFA6A6] md:hidden",
                    i === 0 || i === 5 ? "left-1/2 right-0" : "left-0 right-0"
                  )}
                />
                {i === 2 && (
                  <>
                    <span
                      className="absolute right-0 top-[47px] h-[calc(100%+20px)] w-0.5 bg-[#DFA6A6] md:hidden"
                      aria-hidden
                    />
                    <span
                      className="absolute right-0 top-[47px] h-0.5 w-1/2 bg-[#DFA6A6] md:hidden"
                      aria-hidden
                    />
                  </>
                )}
                <StatValue
                  value={stats.statusCount[step.key] ?? 0}
                  className="text-xl font-bold text-gray-900"
                />
                <span
                  className={cn(
                    "relative flex h-7 w-7 items-center justify-center rounded-full",
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
                  <ItemThumb image={book.image} title={book.title} size="h-12 w-12" />
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
                  <ItemThumb image={toy.image} title={toy.title} size="h-12 w-12" />
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
      </div>
    </RangeProvider>
  );
}
