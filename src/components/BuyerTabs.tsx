"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  STATUS_LABEL,
  STATUS_TYPE,
  PAYMENT_LABEL,
  PAYMENT_BADGE,
  STATUS_BADGE,
  FORMAT_BADGE,
  etaLabel,
} from "@/lib/orderOptions";
import { formatIDR, dateLabel, dateShortLabel, timeShortLabel } from "@/lib/format";
import { ADMIN_WA, waLink } from "@/lib/wa";
import { useBuyerNav } from "@/components/BuyerShell";
import { StageTimeline, StageTimelineVertical, StageStatusBanner } from "@/components/TrackingTimeline";
import { aggregateStamp, currentStageIndex, earliestEta, stageDateParts } from "@/lib/tracking";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  ImageIcon,
  ListOrdered,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  PiggyBank,
  ShieldCheck,
  Search,
  Truck,
  UserRound,
  Wallet,
  Calculator,
  FileText,
} from "lucide-react";

type OrderItemDTO = {
  quantity: number;
  unitPrice: number;
  subtotal: number;
  status: string;
  batchId: string;
  batchName: string | null;
  eta: string;
  kind?: "BUKU" | "MAINAN" | "LAINNYA";
  image: string | null;
  stages: (string | null)[];
  book: { title: string; formats: string[] };
};

export type OrderDTO = {
  id: string;
  invoiceNumber: string;
  paymentStatus: string;
  total: number;
  soldAt: string;
  dp: number | null;
  remaining: number | null;
  shippingCost: number | null;
  trackingNumber: string | null;
  buyerName: string;
  buyerPhone: string | null;
  buyerContact: string | null;
  items: OrderItemDTO[];
};

function BadgeGroup({ payment }: { payment: string }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      <Badge variant="outline" className={`whitespace-nowrap px-2 py-0.5 text-xs ${PAYMENT_BADGE[payment] ?? ""}`}>
        {PAYMENT_LABEL[payment] || payment}
      </Badge>
    </div>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {icon}
      <span className="line-clamp-1 min-w-0 flex-1 text-black/80">{children}</span>
    </div>
  );
}

function ProductTag({ kind }: { kind?: string }) {
  if (kind === "BUKU")
    return (
      <span className="inline-flex items-center rounded-full border border-sky-300 bg-sky-100 px-1.5 text-[10px] font-semibold text-sky-800">
        Buku
      </span>
    );
  if (kind === "MAINAN")
    return (
      <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">
        Mainan
      </span>
    );
  return null;
}

function ItemCover({ image, alt }: { image: string | null; alt: string }) {
  return (
    <div className="relative h-[68px] w-[50px] shrink-0 overflow-hidden rounded-lg border border-[#F0CBCB] bg-white/70">
      {image ? (
        <Image src={image} alt={alt} fill sizes="50px" className="object-cover object-center" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <ImageIcon className="h-4 w-4 text-black/30" />
        </div>
      )}
    </div>
  );
}

function ItemTags({ item }: { item: OrderItemDTO }) {
  return (
    <p className="flex flex-wrap items-center gap-1">
      <ProductTag kind={item.kind} />
      {item.book.formats.map((f) => (
        <span
          key={f}
          className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${FORMAT_BADGE[f] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
        >
          {f}
        </span>
      ))}
      <span
        className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_BADGE[item.status] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
      >
        {STATUS_LABEL[item.status] || item.status}
      </span>
    </p>
  );
}

function OrderCard({ order }: { order: OrderDTO }) {
  const cover = order.items.find((it) => it.image)?.image ?? null;
  const itemCount = order.items.reduce((n, it) => n + it.quantity, 0);
  const firstTitle = order.items[0]?.book.title ?? "—";
  const extraItems = order.items.length - 1;
  const href = `/dashboard/orders/invoice/${order.id}`;

  return (
    <div className="rounded-xl border border-[#F0CBCB]/60 bg-white p-3 shadow-sm md:p-4">
      {/* Mobile: condensed row that opens the invoice detail */}
      <Link href={href} className="flex w-full flex-col gap-2.5 text-left md:hidden">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block font-mono text-xs font-bold break-all text-black">
              {order.invoiceNumber}
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              {dateShortLabel(order.soldAt)} · {timeShortLabel(order.soldAt)}
            </span>
          </span>
          <BadgeGroup payment={order.paymentStatus} />
        </span>
        <span className="flex items-center gap-3">
          <ItemCover image={cover} alt={firstTitle} />
          <span className="min-w-0 flex-1">
            <span className="line-clamp-1 text-sm font-semibold">
              {firstTitle}
              {extraItems > 0 ? ` +${extraItems}` : ""}
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              {itemCount} Item · {formatIDR(order.total)}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#FBE6E6] px-3 py-1.5 text-xs font-semibold text-[#C0474A]">
            Lihat Detail
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </span>
      </Link>

      {/* Desktop: invoice row */}
      <div className="hidden md:flex md:items-center md:gap-4">
        <ItemCover image={cover} alt={firstTitle} />

        <div className="w-52 shrink-0 space-y-2 text-sm">
          <div>
            <p className="font-mono text-sm font-bold break-all text-black">{order.invoiceNumber}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {dateShortLabel(order.soldAt)} · {timeShortLabel(order.soldAt)}
            </p>
          </div>
          <InfoRow icon={<UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}>
            {order.buyerName}
          </InfoRow>
          <InfoRow icon={<Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}>
            {order.buyerPhone || "—"}
          </InfoRow>
          <InfoRow icon={<CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}>
            {dateShortLabel(order.soldAt)}
          </InfoRow>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {order.items.map((it, i) => (
            <div key={i} className="min-w-0">
              <p className="line-clamp-1 text-sm font-semibold">{it.book.title}</p>
              <div className="mt-1">
                <ItemTags item={it} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {it.quantity} × {formatIDR(it.unitPrice)} · {it.batchName ?? "—"} · ETA {etaLabel(it.eta)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <BadgeGroup payment={order.paymentStatus} />
          <span className="text-base font-bold">{formatIDR(order.total)}</span>
          <Link
            href={href}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#FBE6E6] px-3 text-xs font-semibold text-[#C0474A] transition-colors hover:bg-[#F6D5D5]"
          >
            Lihat Detail
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function buildAdminWaText(order: OrderDTO): string {
  return `Halo Admin CuratedByDer,

Saya ${order.buyerName} ingin menanyakan terkait invoice pembelian berikut ${order.invoiceNumber}

Terimakasih`;
}

export function openAdminWa(order: OrderDTO) {
  const link = waLink(ADMIN_WA, buildAdminWaText(order));
  if (link) window.open(link, "_blank");
}

export function BuyerOrderDetail({
  order,
  open,
  onOpenChange,
}: {
  order: OrderDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[80vh] w-[92%] max-w-md overflow-y-auto"
        style={{ backgroundColor: "#F6F1E7" }}
      >
        <DialogHeader>
          <DialogTitle>Detail Pesanan</DialogTitle>
          <DialogDescription className="font-mono text-xs">{order.invoiceNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Tanggal</span>
            <span className="ml-auto font-medium">{dateLabel(order.soldAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Pembeli</span>
            <span className="ml-auto text-right font-medium">{order.buyerName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">No. HP</span>
            <span className="ml-auto text-right font-medium">{order.buyerPhone || "—"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Alamat</span>
            <span className="ml-auto text-right font-medium">{order.buyerContact || "—"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Ongkir</span>
            <span className="ml-auto font-medium">{order.shippingCost != null ? formatIDR(order.shippingCost) : "—"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">No Resi</span>
            <span className="ml-auto text-right font-mono font-medium">{order.trackingNumber || "—"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Status Pembayaran</span>
            <span className="ml-auto font-medium">{PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus}</span>
          </div>
        </div>

        <div className="my-1 h-px w-full bg-black/15" />

        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <ListOrdered className="h-4 w-4" />
          Item
        </p>
        <div className="space-y-2 text-sm">
          {order.items.map((it, i) => (
            <div key={i} className="rounded-lg border p-2">
              <p className="line-clamp-1 min-w-0 flex-1 font-medium">{it.book.title}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1">
                <ProductTag kind={it.kind} />
                {it.book.formats.length
                  ? it.book.formats.map((f) => (
                      <span
                        key={f}
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${FORMAT_BADGE[f] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
                      >
                        {f}
                      </span>
                    ))
                  : ""}
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[it.status] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
                >
                  {STATUS_LABEL[it.status] || it.status}
                </span>
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {it.batchName ?? "—"} · ETA {etaLabel(it.eta)}
              </p>
              <div className="mt-1 grid grid-cols-3 gap-1 text-xs">
                <span>Qty: {it.quantity}</span>
                <span>Harga: {formatIDR(it.unitPrice)}</span>
                <span className="text-right font-medium">{formatIDR(it.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="my-1 h-px bg-black/15" />

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              DP
            </span>
            <span className="font-medium">{formatIDR(order.dp ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <PiggyBank className="h-3.5 w-3.5" />
              Sisa Tagihan
            </span>
            <span className="font-medium">{formatIDR(order.remaining ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Truck className="h-3.5 w-3.5" />
              Ongkir
            </span>
            <span className="font-medium">{order.shippingCost != null ? formatIDR(order.shippingCost) : "—"}</span>
          </div>
          <div className="h-px w-full bg-black/15" />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calculator className="h-3.5 w-3.5" />
              Total
            </span>
            <span className="font-semibold">{formatIDR(order.total)}</span>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button
            onClick={() => window.open(`/api/download/orders/${order.id}`, "_blank")}
            className="flex-1"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button
            type="button"
            onClick={() => openAdminWa(order)}
            className="flex-1 bg-[#25D366] hover:bg-[#1ebe57]"
          >
            <MessageCircle className="h-4 w-4" />
            Hubungi Admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentCard({ order }: { order: OrderDTO }) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: "#F6F1E7" }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 font-semibold leading-snug">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#D97A7A]/30 bg-[#D97A7A]/10">
            <Wallet className="h-5 w-5 text-[#D97A7A]" />
          </span>
          <span className="font-mono text-xs font-bold break-all">{order.invoiceNumber}</span>
        </span>
        <Badge variant="outline" className={`whitespace-nowrap px-2 py-0.5 text-xs ${PAYMENT_BADGE[order.paymentStatus] ?? ""}`}>
          {PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus}
        </Badge>
      </div>

      <div className="mb-2 h-px w-full bg-black/15" />

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            DP
          </span>
          <span className="font-medium">{formatIDR(order.dp ?? 0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <PiggyBank className="h-3.5 w-3.5" />
            Sisa Tagihan
          </span>
          <span className="font-medium">{formatIDR(order.remaining ?? 0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Truck className="h-3.5 w-3.5" />
            Ongkir
          </span>
          <span className="font-medium">{order.shippingCost != null ? formatIDR(order.shippingCost) : "—"}</span>
        </div>
        <div className="h-px w-full bg-black/15" />
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Calculator className="h-3.5 w-3.5" />
            Total
          </span>
          <span className="font-semibold">{formatIDR(order.total)}</span>
        </div>
      </div>

      <div className="mt-3">
        <BuyerOrderDetail order={order} open={detailOpen} onOpenChange={setDetailOpen} />
      </div>
    </div>
  );
}

export function CopyResi({
  value,
  label = "Copy nomor resi",
  valueClassName = "font-mono text-xs font-semibold break-all",
}: {
  value: string | null;
  label?: string;
  valueClassName?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (insecure context) — ignore
    }
  }

  if (!value) return <span className="font-mono text-xs font-semibold">—</span>;

  return (
    <span className="flex items-center gap-1">
      <span className={valueClassName}>{value}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        className="text-[#C96A6A] transition-colors hover:text-[#B04A4A]"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}

export function TrackCard({
  order,
  variant = "list",
}: {
  order: OrderDTO;
  variant?: "list" | "detail";
}) {
  const [expanded, setExpanded] = useState(false);
  const cover = order.items.find((it) => it.image)?.image ?? null;
  const eta = earliestEta(order.items);
  const done = currentStageIndex(order.items);
  const isDelivered = done === STATUS_TYPE.length - 1;
  const currentStamp = aggregateStamp(order.items, done);
  const currentParts = currentStamp ? stageDateParts(currentStamp) : null;
  const statusBanner = (
    <StageStatusBanner
      items={order.items}
      action={
        <Button
          asChild
          className="h-8 gap-1.5 rounded-lg border border-[#D97A7A] bg-white px-3 text-xs font-semibold text-[#B04A4A] shadow-none hover:bg-[#FBE6E6] hover:text-[#B04A4A]"
        >
          <Link href={`/dashboard/orders/tracking/${order.id}`}>
            Lihat Detail Pengiriman
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    />
  );

  return (
    <div className="rounded-xl border border-[#F0CBCB]/60 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="relative h-[92px] w-[66px] shrink-0 overflow-hidden rounded-lg border border-[#F0CBCB] bg-white/70">
            {cover ? (
              <Image
                src={cover}
                alt={order.items[0]?.book.title ?? "Item pesanan"}
                fill
                sizes="66px"
                className="object-cover object-center"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-5 w-5 text-black/30" />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 gap-2">
            <div className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-2">
                {variant === "detail" ? (
                  <CopyResi value={order.invoiceNumber} label="Copy nomor invoice" />
                ) : (
                  <span className="font-mono text-xs font-bold break-all">{order.invoiceNumber}</span>
                )}
              </span>

              <div className="mt-3 space-y-2.5">
                {order.items.map((it, i) => (
                  <div key={i}>
                    <p className="line-clamp-1 text-sm font-semibold">{it.book.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1">
                      <ProductTag kind={it.kind} />
                      {it.book.formats.map((f) => (
                        <span
                          key={f}
                          className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${FORMAT_BADGE[f] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
                        >
                          {f}
                        </span>
                      ))}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {it.quantity} × {formatIDR(it.unitPrice)} · ETA {etaLabel(it.eta)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {variant === "list" && (
              <div className="flex shrink-0 flex-col items-end justify-between gap-2 md:hidden">
                <BadgeGroup payment={order.paymentStatus} />
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="flex h-7 items-center gap-1 rounded-lg bg-[#FBE6E6] px-2.5 text-[11px] font-semibold text-[#B04A4A] transition-colors hover:bg-[#F6D5D5]"
                >
                  {expanded ? "Sembunyikan" : "Tampilkan"}
                  {expanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {variant === "list" && (
          <div className="hidden flex-col gap-1.5 text-xs text-black/70 md:flex md:flex-1">
            <p className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">No. Resi:</span>
              <CopyResi value={order.trackingNumber} />
            </p>
            <p className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Estimasi Tiba:</span>
              <span className="font-semibold">{etaLabel(eta)}</span>
            </p>
          </div>
        )}

        <div className="hidden shrink-0 flex-col items-start gap-4 md:flex md:items-end">
          <BadgeGroup payment={order.paymentStatus} />

          {variant === "detail" ? (
            <Link
              href={`/dashboard/orders/invoice/${order.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#C96A6A] transition-colors hover:text-[#B04A4A]"
            >
              Lihat Invoice
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Button
              asChild
              className="h-8 gap-1.5 rounded-lg border border-[#D97A7A] bg-white/70 px-3 text-xs font-semibold text-[#B04A4A] shadow-none hover:bg-[#FBE6E6] hover:text-[#B04A4A]"
            >
              <Link href={`/dashboard/orders/tracking/${order.id}`}>
                Lihat Detail Pengiriman
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {variant === "detail" && (
        <div className="mt-2 flex justify-end md:hidden">
          <BadgeGroup payment={order.paymentStatus} />
        </div>
      )}

      {variant === "list" ? (
        <>
          <div className="mt-3 hidden border-t border-[#F0CBCB]/60 pt-3 md:block">
            <StageTimeline items={order.items} />
          </div>

          <div className="mt-3 border-t border-[#F0CBCB]/60 pt-3 md:hidden">
            {expanded ? (
              <StageTimelineVertical items={order.items} currentExtra={statusBanner} />
            ) : (
              <div className="flex w-full items-center gap-2.5">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    isDelivered
                      ? "bg-emerald-500 text-white"
                      : "bg-[#D97A7A] text-white ring-4 ring-[#FBE6E6]"
                  }`}
                >
                  {isDelivered ? <Check className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-black/80">
                    {STATUS_LABEL[STATUS_TYPE[done]] ?? STATUS_TYPE[done]}
                  </span>
                  {currentParts && (
                    <span className="block text-[11px] text-black/50">
                      {currentParts.date}, {currentParts.time}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {(!expanded || isDelivered) && <div className="mt-3 md:hidden">{statusBanner}</div>}
        </>
      ) : (
        <div className="mt-3 hidden border-t border-[#F0CBCB]/60 pt-3 md:block">
          <StageTimeline items={order.items} />
        </div>
      )}
    </div>
  );
}

export function BuyerTabs({
  orders,
  total,
  page,
  pageSize,
  basePath,
  query,
  defaultTab,
}: {
  orders: OrderDTO[];
  total: number;
  page: number;
  pageSize: number;
  basePath: string;
  query: Record<string, string | undefined>;
  defaultTab: string;
}) {
  const { active: pending, navigate } = useBuyerNav("tabs");
  const searchParams = useSearchParams();
  const tab = defaultTab;

  const lastRequested = useRef<string | null>(null);

  function selectTab(v: string) {
    if (v === tab || v === lastRequested.current) return;
    lastRequested.current = v;
    const params = new URLSearchParams(searchParams.toString());
    if (v === "invoice") params.delete("tab");
    else params.set("tab", v);
    navigate(`${basePath}?${params.toString()}`);
  }

  const tabTriggerCls =
    "flex-1 gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-black/60 transition-colors data-[state=active]:bg-[#FBE6E6] data-[state=active]:text-[#C0474A] data-[state=active]:shadow-none";

  const current = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  return (
    <Tabs value={tab} onValueChange={selectTab}>
      <TabsList className="h-auto w-full gap-1 overflow-hidden rounded-xl border border-[#F0CBCB] bg-[#FDF1F1] p-1">
        <TabsTrigger value="invoice" className={tabTriggerCls}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Invoice
        </TabsTrigger>
        <TabsTrigger value="payment" className={tabTriggerCls}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          Pembayaran
        </TabsTrigger>
        <TabsTrigger value="shipment" className={tabTriggerCls}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Lacak
        </TabsTrigger>
      </TabsList>

      <TabsContent value="invoice" className="mt-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((s) => (
              <OrderCard key={s.id} order={s} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="payment" className="mt-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((s) => (
              <PaymentCard key={s.id} order={s} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="shipment" className="mt-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No shipments yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((s) => (
              <TrackCard key={s.id} order={s} />
            ))}
          </div>
        )}
      </TabsContent>

      <div className="mt-5 flex flex-col items-center gap-3 md:flex-row md:justify-between">
        <p className="text-xs text-muted-foreground">
          Menampilkan {start} - {end} dari {total} {tab === "invoice" ? "invoice" : "pesanan"}
        </p>
        <Pagination
          total={total}
          page={page}
          pageSize={pageSize}
          basePath={basePath}
          query={query}
          variant="rose"
        />
      </div>
    </Tabs>
  );
}