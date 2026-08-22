"use client";

import { useRouter } from "next/navigation";
import { buildOrderPdf } from "@/lib/orderPdf";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatIDR, dateLabel } from "@/lib/format";
import { waLink } from "@/lib/wa";
import { STATUS_LABEL, PAYMENT_LABEL, etaLabel } from "@/lib/orderOptions";
import {
  Calculator,
  CalendarClock,
  Download,
  Layers,
  ListOrdered,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Phone,
  PiggyBank,
  ShieldCheck,
  Truck,
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

export type OrderDTO = {
  id: string;
  invoiceNumber: string;
  eta: string | null;
  soldAt: Date;
  total: number;
  dp: number | null;
  remaining: number | null;
  shippingCost: number | null;
  trackingNumber: string | null;
  paymentStatus: string;
  status: string;
  batch: { id: string; name: string } | null;
  buyer: { id: string; name: string; phone: string | null; contact: string | null };
  items: OrderItemDTO[];
};

function buildWaText(order: OrderDTO, pdfUrl: string): string {
  const lines: string[] = [
    `Halo kak ${order.buyer.name},`,
    "",
    "*Terimakasih untuk pembelian buku anda*",
    "",
    "*Detail Pembelian*",
    `Invoice : ${order.invoiceNumber}`,
    `Total Harga: ${formatIDR(order.total)}`,
    `Ongkir : ${order.shippingCost != null ? formatIDR(order.shippingCost) : "--"}`,
    `No Resi : ${order.trackingNumber || "--"}`,
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

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
}: {
  order: OrderDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
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
            <Truck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Ongkir</span>
            <span className="ml-auto font-medium">{order.shippingCost != null ? formatIDR(order.shippingCost) : "--"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">No Resi</span>
            <span className="ml-auto text-right font-mono font-medium">{order.trackingNumber || "—"}</span>
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
            <div key={it.id || i} className="rounded-lg border p-2">
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
              onOpenChange(false);
              router.push(`/admin/orders/${order.id}/edit`);
            }}
            className="flex-1"
          >
            Ubah
          </Button>
          <Button onClick={() => downloadPdf(order)} className="flex-1">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
  );
}