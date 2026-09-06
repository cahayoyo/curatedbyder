import Link from "next/link";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  Heart,
  Home,
  ImageIcon,
  ReceiptText,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import {
  PAYMENT_BADGE,
  STATUSES,
  STATUS_BADGE,
  STATUS_LABEL,
} from "@/lib/orderOptions";
import { dateLabel, formatIDR } from "@/lib/format";
import { FormatBadge } from "@/components/FormatBadge";
import { OrderDTO, TrackCard } from "@/components/BuyerTabs";
import {
  OrderDetailButton,
  PayNowButton,
} from "@/components/dashboard/DashboardActions";

const orderInclude = {
  buyer: { select: { name: true, phone: true, contact: true } },
  items: {
    include: {
      batch: { select: { name: true } },
      book: { select: { title: true, formats: true } },
      toy: { select: { title: true } },
    },
  },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function toDTO(s: OrderWithItems): OrderDTO {
  return {
    id: s.id,
    invoiceNumber: s.invoiceNumber,
    paymentStatus: s.paymentStatus,
    total: s.total,
    soldAt: s.soldAt.toISOString(),
    dp: s.dp,
    remaining: s.remaining ?? Math.max(0, s.total - (s.dp ?? 0)),
    shippingCost: s.shippingCost,
    trackingNumber: s.trackingNumber,
    buyerName: s.buyer.name,
    buyerPhone: s.buyer.phone,
    buyerContact: s.buyer.contact,
    items: s.items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
      status: i.status,
      batchId: i.batchId,
      batchName: i.batch?.name ?? null,
      eta: i.eta,
      kind: i.book ? "BUKU" : i.toy ? "MAINAN" : "LAINNYA",
      book: {
        title: i.book?.title ?? i.toy?.title ?? "—",
        formats: i.book?.formats ?? [],
      },
    })),
  };
}

function firstTitle(o: OrderDTO) {
  const t = o.items[0]?.book.title ?? "—";
  return o.items.length > 1 ? `${t} +${o.items.length - 1} lainnya` : t;
}

function StatusBadge({ order }: { order: OrderDTO }) {
  if (order.paymentStatus === "NO_PAYMENT") {
    return (
      <span
        className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${PAYMENT_BADGE.NO_PAYMENT}`}
      >
        Unpaid
      </span>
    );
  }
  const current = STATUSES.find((s) => order.items.some((it) => it.status === s.value))?.value;
  return (
    <span
      className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${STATUS_BADGE[current ?? ""] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
    >
      {current ? STATUS_LABEL[current] : "—"}
    </span>
  );
}

export default async function DashboardPage() {
  const session = await requireRole("USER");
  const userId = session.user.id;

  const [activeCount, unpaidCount, shippingCount, doneCount, recent, unpaid, shipped, catalogBooks, catalogToys] =
    await Promise.all([
      db.order.count({
        where: { buyerId: userId, items: { some: { status: { not: "ORDER_DELIVERED" } } } },
      }),
      db.order.count({ where: { buyerId: userId, paymentStatus: { not: "LUNAS" } } }),
      db.order.count({
        where: { buyerId: userId, items: { some: { status: "SHIPPED_TO_CUSTOMER" } } },
      }),
      db.order.count({
        where: { buyerId: userId, items: { every: { status: "ORDER_DELIVERED" } } },
      }),
      db.order.findMany({
        where: { buyerId: userId },
        orderBy: { soldAt: "desc" },
        take: 3,
        include: orderInclude,
      }),
      db.order.findFirst({
        where: { buyerId: userId, paymentStatus: "NO_PAYMENT" },
        orderBy: { soldAt: "desc" },
        include: orderInclude,
      }),
      db.order.findFirst({
        where: { buyerId: userId, items: { some: { status: "SHIPPED_TO_CUSTOMER" } } },
        orderBy: { soldAt: "desc" },
        include: orderInclude,
      }),
      db.book.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, title: true, image: true, info: true, formats: true },
      }),
      db.toy.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, title: true, image: true, info: true },
      }),
    ]);

  const recentOrders = recent.map(toDTO);
  const unpaidOrder = unpaid ? toDTO(unpaid) : null;
  const shippedOrder = shipped ? toDTO(shipped) : null;

  const catalogItems = [
    ...catalogBooks.map((b) => ({
      id: b.id,
      title: b.title,
      image: b.image,
      info: b.info,
      kind: "BUKU" as const,
      formats: b.formats as string[],
    })),
    ...catalogToys.map((t) => ({
      id: t.id,
      title: t.title,
      image: t.image,
      info: t.info,
      kind: "MAINAN" as const,
      formats: [] as string[],
    })),
  ];

  const stats = [
    {
      label: "Pesanan Aktif",
      value: activeCount,
      caption: "Sedang diproses",
      icon: ShoppingCart,
      iconCls: "border-red-200 bg-red-50 text-[#D97A7A]",
    },
    {
      label: "Menunggu Sisa Tagihan",
      value: unpaidCount,
      caption: "Segera selesaikan",
      icon: Wallet,
      iconCls: "border-orange-200 bg-orange-50 text-orange-500",
    },
    {
      label: "Dalam Pengiriman",
      value: shippingCount,
      caption: "Menuju alamatmu",
      icon: Truck,
      iconCls: "border-sky-200 bg-sky-50 text-sky-500",
    },
    {
      label: "Selesai",
      value: doneCount,
      caption: "Pesanan telah diterima",
      icon: CheckCircle2,
      iconCls: "border-emerald-200 bg-emerald-50 text-emerald-500",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Home className="h-6 w-6 text-[#D97A7A]" />
          Dashboard
        </h2>
        <p className="text-sm text-muted-foreground">
          Pantau pesanan, pembayaran, dan aktivitas bacamu di sini.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-[#FBE6E6] to-[#F6D5D5] p-5">
        <div className="min-w-0">
          <h3 className="text-xl font-bold">Halo, {session.user.name ?? "Pembaca"} 👋</h3>
          <p className="mt-1 max-w-md text-sm text-black/70">
            Terima kasih sudah menjadi bagian dari CuratedByDer. Terus temukan cerita baru dan
            buat harimu lebih bermakna!
          </p>
        </div>
        <div className="hidden shrink-0 flex-col items-center gap-3 md:flex">
          <p className="text-right font-serif text-2xl italic leading-tight text-[#C96A6A]">
            Good Books,
            <br />
            Brighter Days
            <Heart className="ml-1 inline h-4 w-4 fill-[#D97A7A] text-[#D97A7A]" />
          </p>
          <Link
            href="/dashboard/catalog"
            className="flex items-center gap-1.5 rounded-full bg-[#D97A7A] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#c9686b]"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Jelajahi Katalog
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border bg-white p-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${s.iconCls}`}
            >
              <s.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-black/60">{s.label}</p>
              <p className="text-2xl font-bold leading-tight">{s.value}</p>
              <p className="truncate text-xs text-black/50">{s.caption}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 font-semibold">
                <ReceiptText className="h-4 w-4 text-[#D97A7A]" />
                Pesanan Terbaru
              </h4>
              <Link
                href="/dashboard/orders"
                className="flex items-center gap-0.5 text-xs font-semibold text-[#D97A7A] hover:underline"
              >
                Lihat Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

          {recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Belum ada pesanan.</p>
          ) : (
            <>
              <table className="mt-3 hidden w-full text-sm md:table">
                <thead>
                  <tr className="border-b text-left text-xs text-black/60">
                    <th className="py-2 font-medium">#</th>
                    <th className="py-2 font-medium">Invoice</th>
                    <th className="py-2 font-medium">Produk</th>
                    <th className="py-2 font-medium">Tanggal</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o, i) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2.5">{i + 1}</td>
                      <td className="font-mono text-xs font-semibold break-all">
                        {o.invoiceNumber}
                      </td>
                      <td className="max-w-[180px] truncate">{firstTitle(o)}</td>
                      <td className="whitespace-nowrap text-xs">{dateLabel(o.soldAt)}</td>
                      <td>
                        <StatusBadge order={o} />
                      </td>
                      <td className="text-right">
                        <OrderDetailButton
                          order={o}
                          className="whitespace-nowrap text-xs font-semibold text-[#D97A7A] hover:underline"
                        >
                          Lihat Detail
                        </OrderDetailButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-3 space-y-2 md:hidden">
                {recentOrders.map((o) => (
                  <div key={o.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold break-all">{o.invoiceNumber}</p>
                        <p className="mt-0.5 line-clamp-1 text-sm">{firstTitle(o)}</p>
                        <p className="text-[11px] text-black/50">{dateLabel(o.soldAt)}</p>
                      </div>
                      <StatusBadge order={o} />
                    </div>
                    <OrderDetailButton
                      order={o}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-[#D97A7A]/40 py-1.5 text-xs font-semibold text-[#D97A7A]"
                    >
                      Lihat Detail
                      <ChevronRight className="h-3.5 w-3.5" />
                    </OrderDetailButton>
                  </div>
                ))}
              </div>
            </>
          )}
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 font-semibold">
                <BookOpen className="h-4 w-4 text-[#D97A7A]" />
                Katalog Buku &amp; Mainan
              </h4>
              <Link
                href="/dashboard/catalog"
                className="flex items-center gap-0.5 text-xs font-semibold text-[#D97A7A] hover:underline"
              >
                Lihat Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {catalogItems.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Katalog segera hadir.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {catalogItems.map((item) => (
                  <div
                    key={`${item.kind}-${item.id}`}
                    className="flex flex-col rounded-lg border p-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded border bg-black/5">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-black/30" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug">
                          {item.title}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-1">
                          <span
                            className={`inline-flex items-center rounded-full border px-1.5 text-[10px] font-semibold ${
                              item.kind === "BUKU"
                                ? "border-sky-300 bg-sky-100 text-sky-800"
                                : "border-amber-300 bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.kind === "BUKU" ? "Buku" : "Mainan"}
                          </span>
                          {item.formats.map((f) => (
                            <FormatBadge key={f} value={f} />
                          ))}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex-1">
                      {item.info && (
                        <p className="line-clamp-2 text-xs italic text-black/60">
                          &ldquo;{item.info}&rdquo;
                        </p>
                      )}
                    </div>
                    <Link
                      href="/dashboard/catalog"
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-[#D97A7A]/40 py-1.5 text-xs font-semibold text-[#D97A7A] hover:bg-[#D97A7A]/5"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Lihat Katalog
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {unpaidOrder && (
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="flex items-center gap-2 font-semibold">
                  <Wallet className="h-4 w-4 text-[#D97A7A]" />
                  Pembayaran Perlu Diperhatikan
                </h4>
                <Link href="/dashboard/orders?tab=payment" aria-label="Lihat pembayaran">
                  <ChevronRight className="h-4 w-4 text-[#D97A7A]" />
                </Link>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#D97A7A]/30 bg-[#D97A7A]/10">
                  <ReceiptText className="h-5 w-5 text-[#D97A7A]" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold break-all">
                    {unpaidOrder.invoiceNumber}
                  </p>
                  <p className="line-clamp-1 text-sm">{firstTitle(unpaidOrder)}</p>
                  <p className="text-[11px] text-black/50">{dateLabel(unpaidOrder.soldAt)}</p>
                  <p className="mt-1 text-xs text-black/60">Total Pembayaran</p>
                  <p className="font-bold">{formatIDR(unpaidOrder.total)}</p>
                </div>
              </div>
              <div className="mt-3">
                <PayNowButton order={unpaidOrder} />
              </div>
            </div>
          )}

          {shippedOrder && (
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="flex items-center gap-2 font-semibold">
                  <Truck className="h-4 w-4 text-[#D97A7A]" />
                  Status Pengiriman
                </h4>
                <Link href="/dashboard/orders?tab=shipment" aria-label="Lihat pengiriman">
                  <ChevronRight className="h-4 w-4 text-[#D97A7A]" />
                </Link>
              </div>
              <div className="mt-3">
                <TrackCard order={shippedOrder} />
              </div>
              <Link
                href="/dashboard/orders?tab=shipment"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-[#D97A7A]/40 py-2 text-xs font-semibold text-[#D97A7A] hover:bg-[#D97A7A]/5"
              >
                <FileText className="h-3.5 w-3.5" />
                Lihat Detail Pengiriman
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
