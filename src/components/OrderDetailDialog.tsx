"use client";

import { useRouter } from "next/navigation";
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
import { STATUS_LABEL, PAYMENT_LABEL, STATUS_BADGE, etaLabel, FORMAT_BADGE } from "@/lib/orderOptions";
import { cn } from "@/lib/utils";
import {
  Calculator,
  CalendarClock,
  Download,
  ListOrdered,
  MapPin,
  MessageCircle,
  Package,
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
  status: string;
  batchId: string;
  batchName: string | null;
  eta: string;
  kind?: "BUKU" | "MAINAN" | "LAINNYA";
  book: { title: string; formats: string[]; status: "READY_STOCK" | "PRE_ORDER" };
};

function ProductTag({ kind }: { kind?: string }) {
  if (kind === "BUKU")
    return (
      <span className="ml-1 inline-flex items-center rounded-full border border-sky-300 bg-sky-100 px-1.5 text-[10px] font-semibold text-sky-800">
        Buku
      </span>
    );
  if (kind === "MAINAN")
    return (
      <span className="ml-1 inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">
        Mainan
      </span>
    );
  return null;
}

export type OrderDTO = {
  id: string;
  invoiceNumber: string;
  soldAt: Date;
  total: number;
  dp: number | null;
  remaining: number | null;
  shippingCost: number | null;
  trackingNumber: string | null;
  paymentStatus: string;
  buyer: { id: string; name: string; username: string | null; phone: string | null; contact: string | null };
  items: OrderItemDTO[];
};

function getPeriod(date: Date): string {
  const hour =
    Number(
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      }).format(date)
    ) % 24;
  if (hour >= 18 || hour === 0) return "malam";
  if (hour <= 10) return "pagi";
  if (hour <= 14) return "siang";
  return "sore";
}

function buildWaText(order: OrderDTO): string {
  const period = getPeriod(new Date());
  const pdfLink = `${window.location.origin}/api/download/orders/${order.id}`;
  const lines: string[] = [
    `Selamat ${period}, Kak ${order.buyer.name}. Izin share invoice pelunasan orderan kakak. Mohon diperiksa kembali ya kak 😊🙏🏼`,
    "",
    "*Detail Pesanan (Link PDF) :*",
    pdfLink,
  ];
  lines.push(
    "",
    `Invoice : ${order.invoiceNumber}`,
    `DP : ${order.dp != null ? formatIDR(order.dp) : "--"}`,
    `Sisa : ${order.remaining != null ? formatIDR(order.remaining) : "--"}`,
    `Ongkir : ${order.shippingCost != null ? formatIDR(order.shippingCost) : "--"}`,
    `*Total : ${formatIDR(order.total)}*`,
    "",
    "Transfer hanya melalui rekening :",
    "BCA 8990789330 Adera Nurul",
    "JAGO 103600160006 Adera Nurul",
    "",
    "Terimakasih sudah belanja buku anaknya di Curatedbyder. Semoga lancar selalu rezeki urusannya kak 🤗",
    "",
    "Silahkan akses curatedbyder.store untuk cek history order, pembayaran, dan pengiriman",
    `Username : ${order.buyer.username || "--"}`,
    `No HP : ${order.buyer.phone || "--"}`,
  );
  return lines.join("\n");
}

async function downloadPdf(order: OrderDTO) {
  const [{ buildOrderPdf }, { LOGO_BASE64 }] = await Promise.all([
    import("@/lib/orderPdf"),
    import("@/lib/logo"),
  ]);
  const doc = buildOrderPdf({
    ...order,
    logoBase64: LOGO_BASE64,
    items: order.items.map((it) => ({
      title: it.book.title,
      formats: it.book.formats,
      batchName: it.batchName,
      eta: it.eta,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      subtotal: it.subtotal,
    })),
  });
  doc.save(`pesanan-${order.invoiceNumber}.pdf`);
}

function openWa(order: OrderDTO) {
  if (!order.buyer.phone) return;
  const link = waLink(order.buyer.phone, buildWaText(order));
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
              </p>
              <div className="mt-1 grid grid-cols-3 gap-1 text-xs">
                <span>Qty: {it.quantity}</span>
                <span>Harga: {formatIDR(it.unitPrice)}</span>
                <span className="text-right font-medium">{formatIDR(it.subtotal)}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                  {it.batchName ?? "—"}
                </span>
                <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                  ETA {etaLabel(it.eta)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    STATUS_BADGE[it.status] ?? "border-gray-300 bg-gray-100 text-gray-700"
                  )}
                >
                  {STATUS_LABEL[it.status] ?? it.status}
                </span>
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
              Sisa
            </span>
            <span className="font-medium">{formatIDR(order.remaining ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Truck className="h-3.5 w-3.5" />
              Ongkir
            </span>
            <span className="font-medium">{order.shippingCost != null ? formatIDR(order.shippingCost) : "--"}</span>
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