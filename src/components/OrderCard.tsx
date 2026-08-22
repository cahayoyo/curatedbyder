"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildOrderPdf } from "@/lib/orderPdf";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/format";
import { waLink } from "@/lib/wa";
import { STATUSES, PAYMENT_STATUSES, SOURCES, ETAS } from "@/lib/orderOptions";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Calculator,
  CalendarClock,
  Download,
  Eye,
  Layers,
  ListOrdered,
  MapPin,
  MessageCircle,
  MoreVertical,
  PackageCheck,
  Pencil,
  PiggyBank,
  Phone,
  ReceiptText,
  ShieldCheck,
  Store,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";

type OrderItemDTO = {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  book: { title: string; formats: string[]; status: "READY_STOCK" | "PRE_ORDER" };
};

type OrderDTO = {
  id: string;
  invoiceNumber: string;
  eta: string | null;
  soldAt: Date;
  source: string;
  total: number;
  dp: number | null;
  remaining: number | null;
  paymentStatus: string;
  status: string;
  batch: { id: string; name: string } | null;
  buyer: { id: string; name: string; phone: string | null; contact: string | null };
  items: OrderItemDTO[];
};

function HintIcon({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label={title}
        className="flex items-center justify-center rounded text-muted-foreground transition-colors hover:text-black"
      >
        {icon}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-black/10 bg-white p-1.5 text-[11px] leading-snug shadow-md">
            <p className="font-semibold">{title}</p>
            <p className="break-words text-black/70">{detail || "—"}</p>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ icon, title, detail, label, children }: { icon: React.ReactNode; title: string; detail: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <HintIcon icon={icon} title={title} detail={detail} />
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <span className="line-clamp-1 min-w-0 flex-1 text-black/80">{children}</span>
    </div>
  );
}

const SOURCE_LABEL: Record<string, string> = Object.fromEntries(
  SOURCES.map((s) => [s.value, s.label])
);
const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));
const PAYMENT_LABEL: Record<string, string> = Object.fromEntries(PAYMENT_STATUSES.map((p) => [p.value, p.label]));

function etaLabel(v: string | null | undefined) {
  if (v == null) return "—";
  return ETAS.find((e) => e.value === v)?.label ?? v;
}

function dateLabel(v: Date) {
  return new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function buildWaText(order: OrderDTO, pdfUrl: string): string {
  const lines: string[] = [
    `Halo kak ${order.buyer.name},`,
    "",
    "*Terimakasih untuk pembelian buku anda*",
    "",
    "*Detail Pembelian*",
    `Invoice : ${order.invoiceNumber}`,
    `Total Harga Buku: ${formatIDR(order.total)}`,
    `Alamat : ${order.buyer.contact || "—"}`,
    "",
    "*Detail Buku*",
  ];
  if (order.items.length === 1) {
    const it = order.items[0];
    lines.push(
      `Nama Buku : ${it.book.title}`,
      `Quantity : ${it.quantity} x ${formatIDR(it.unitPrice)}`
    );
  } else {
    order.items.forEach((it, i) => {
      if (i > 0) lines.push("");
      lines.push(`Buku ${i + 1}`);
      lines.push(
        `Nama Buku : ${it.book.title}`,
        `Quantity : ${it.quantity} x ${formatIDR(it.unitPrice)}`
      );
    });
  }
  lines.push("", `Link Invoice Order PDF :`, `${pdfUrl}`);
  return lines.join("\n");
}

function downloadPdf(order: OrderDTO) {
  const doc = buildOrderPdf(order);
  doc.save(`pesanan-${order.invoiceNumber}.pdf`);
}

function openWa(order: OrderDTO) {
  if (!order.buyer.phone) return;
  const pdfUrl = `${window.location.origin}/api/download/orders/${order.id}`;
  const link = waLink(order.buyer.phone, buildWaText(order, pdfUrl));
  if (link) window.open(link, "_blank");
}

export function OrderCard({ order, onDelete }: { order: OrderDTO; onDelete: () => void }) {
  const router = useRouter();
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: "#F6F1E7" }}>
      {/* Header: invoice + status badges + 3-dot menu */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 font-semibold leading-snug">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#D97A7A]/30 bg-[#D97A7A]/10">
            <ReceiptText className="h-5 w-5 text-[#D97A7A]" />
          </span>
          <span className="font-mono text-xs font-bold">{order.invoiceNumber}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="outline" className="whitespace-nowrap border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
            {PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus}
          </Badge>
          <Badge variant="outline" className="whitespace-nowrap border-sky-300 bg-sky-100 px-2 py-0.5 text-xs text-sky-800">
            {STATUS_LABEL[order.status] || order.status}
          </Badge>
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Aksi pesanan"
              className="h-8 w-8 shrink-0 border border-black/10 bg-black/10 text-black hover:bg-black/20 hover:text-black"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ backgroundColor: "#FED6D6" }}>
            <DropdownMenuItem
              onSelect={() => setDetailOpen(true)}
              className="cursor-pointer text-black/80 hover:bg-[#D97A7A] hover:text-white focus:bg-[#D97A7A] focus:text-white"
            >
              <Eye className="h-4 w-4" />
              Lihat
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => router.push(`/admin/orders/${order.id}/edit`)}
              className="cursor-pointer text-black/80 hover:bg-[#D97A7A] hover:text-white focus:bg-[#D97A7A] focus:text-white"
            >
              <Pencil className="h-4 w-4" />
              Ubah
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              className="cursor-pointer text-red-600 hover:bg-red-500 hover:text-white focus:bg-red-500 focus:text-white"
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>

      {/* Divider under title */}
      <div className="mb-2 h-px w-full bg-black/15" />

      {/* Info section: 2x2 grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-1 text-sm">
        <Row icon={<UserRound className="h-3.5 w-3.5 shrink-0" />} title="Nama Pembeli" detail={order.buyer.name} label="Nama:">
          {order.buyer.name}
        </Row>
        <Row icon={<Layers className="h-3.5 w-3.5 shrink-0" />} title="Batch" detail={order.batch?.name || "—"} label="Batch:">
          {order.batch?.name || "—"}
        </Row>
        <Row icon={<Store className="h-3.5 w-3.5 shrink-0" />} title="Sumber" detail={SOURCE_LABEL[order.source] || order.source} label="Source:">
          {SOURCE_LABEL[order.source] || order.source}
        </Row>
        <Row icon={<CalendarClock className="h-3.5 w-3.5 shrink-0" />} title="Eta" detail={etaLabel(order.eta)} label="ETA:">
          {etaLabel(order.eta)}
        </Row>
      </div>

      {/* Divider */}
      <div className="mt-2 h-px w-full bg-black/15" />

      {/* Items */}
      <div className="mt-2 space-y-2.5">
        {order.items.map((it, i) => (
          <div key={it.id || i} className="flex items-start gap-1.5 text-sm">
            <div className="mt-[3px]">
              <HintIcon
                icon={<BookOpen className="h-3.5 w-3.5 shrink-0" />}
                title={`Item ${i + 1}`}
                detail={`${it.book.title} · ${it.book.formats.length ? it.book.formats.join(", ") : "—"}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <span className="line-clamp-1">{it.book.title}</span>
                <span className="shrink-0 font-bold">{formatIDR(it.subtotal)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {it.book.formats.length ? it.book.formats.join(", ") : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {it.quantity} × {formatIDR(it.unitPrice)}
              </p>
              <span
                className={cn(
                  "mt-0.5 inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium",
                  it.book.status === "PRE_ORDER"
                    ? "border-amber-300 bg-yellow-300 text-yellow-900"
                    : "border-emerald-300 bg-emerald-100 text-emerald-800"
                )}
              >
                {it.book.status === "PRE_ORDER" ? "Pre Order" : "Ready Stok"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mt-2 h-px w-full bg-black/15" />

      {/* Price summary: label on top, value below */}
      <div className="mt-2 flex flex-wrap items-start justify-center gap-x-8 gap-y-2 text-sm">
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calculator className="h-3.5 w-3.5" />
            <span>Total</span>
          </div>
          <span className="font-bold">{formatIDR(order.total)}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            <span>DP</span>
          </div>
          <span className="font-semibold">{formatIDR(order.dp ?? 0)}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <PiggyBank className="h-3.5 w-3.5" />
            <span>Sisa</span>
          </div>
          <span className="font-semibold">{formatIDR(order.remaining ?? 0)}</span>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[80vh] w-[92%] max-w-md overflow-y-auto" style={{ backgroundColor: "#F6F1E7" }}>
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
              <span className="ml-auto text-right font-medium">{order.buyer.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">No. HP</span>
              <span className="ml-auto text-right font-medium">{order.buyer.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Alamat</span>
              <span className="ml-auto text-right font-medium">{order.buyer.contact || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Sumber</span>
              <span className="ml-auto font-medium">{SOURCE_LABEL[order.source] || order.source}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Batch</span>
              <span className="ml-auto font-medium">{order.batch?.name || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">ETA</span>
              <span className="ml-auto font-medium">{etaLabel(order.eta)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <PackageCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Status Pesanan</span>
              <span className="ml-auto font-medium">{STATUS_LABEL[order.status] || order.status}</span>
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
              <div key={it.id || i} className={cn("rounded-lg border p-2", i > 0 && "border-black/10")}>
                <p className="font-medium">{it.book.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Format: {it.book.formats.length ? it.book.formats.join(", ") : "—"}
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
                <Calculator className="h-3.5 w-3.5" />
                Total
              </span>
              <span className="font-semibold">{formatIDR(order.total)}</span>
            </div>
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
                Sisa
              </span>
              <span className="font-medium">{formatIDR(order.remaining ?? 0)}</span>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2">
            <Button
              onClick={() => {
                setDetailOpen(false);
                router.push(`/admin/orders/${order.id}/edit`);
              }}
              className="flex-1"
            >
              Ubah
            </Button>
            <Button
              onClick={() => downloadPdf(order)}
              className="flex-1"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => setDetailOpen(false)}
              className="flex-1 border border-input bg-transparent"
            >
              Tutup
            </Button>
          </DialogFooter>

          {order.buyer.phone && (
            <button
              type="button"
              onClick={() => openWa(order)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1ebe57]"
            >
              <MessageCircle className="h-4 w-4" />
              Hubungi Pembeli
            </button>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[90%] max-w-sm" style={{ backgroundColor: "#FED6D6" }}>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription className="text-black/80">
              Apakah anda benar ingin menghapus order &quot;{order.invoiceNumber}&quot;? Stok buku akan dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="flex-1 border border-input bg-transparent"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                setDeleteOpen(false);
                onDelete();
              }}
              className="flex-1 border border-input bg-transparent text-black transition-colors hover:bg-red-500 hover:text-white"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}