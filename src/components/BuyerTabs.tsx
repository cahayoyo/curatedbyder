"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import {
  STATUS_LABEL,
  PAYMENT_LABEL,
  PAYMENT_BADGE,
  STATUS_BADGE,
  FORMAT_BADGE,
  etaLabel,
} from "@/lib/orderOptions";
import { formatIDR } from "@/lib/format";
import { waLink } from "@/lib/wa";
import {
  Calculator,
  CalendarClock,
  Download,
  Eye,
  FileText,
  Layers,
  MessageCircle,
  MoreVertical,
  Package,
  Phone,
  PiggyBank,
  ReceiptText,
  Search,
  ShoppingCart,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";

type OrderItemDTO = {
  quantity: number;
  unitPrice: number;
  book: { title: string; formats: string[] };
};

export type OrderDTO = {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  soldAt: string;
  dp: number | null;
  remaining: number | null;
  eta: string | null;
  shippingCost: number | null;
  trackingNumber: string | null;
  batchName: string | null;
  buyerName: string;
  buyerPhone: string | null;
  items: OrderItemDTO[];
};

const ADMIN_WA = "6281381346059";

function BadgeGroup({ status, payment }: { status: string; payment: string }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      <Badge variant="outline" className={`whitespace-nowrap px-2 py-0.5 text-xs ${PAYMENT_BADGE[payment] ?? ""}`}>
        {PAYMENT_LABEL[payment] || payment}
      </Badge>
      <Badge variant="outline" className={`whitespace-nowrap px-2 py-0.5 text-xs ${STATUS_BADGE[status] ?? ""}`}>
        {STATUS_LABEL[status] || status}
      </Badge>
    </div>
  );
}

function InfoRow({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {icon}
      <span className="w-16 shrink-0 text-muted-foreground">{title}</span>
      <span className="line-clamp-1 min-w-0 flex-1 text-black/80">{children}</span>
    </div>
  );
}

function SummaryCol({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1 text-xs text-black/60">
        {icon}
        <span>{title}</span>
      </div>
      <span className="font-semibold">{children}</span>
    </div>
  );
}

function OrderCard({ order }: { order: OrderDTO }) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: "#F6F1E7" }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 font-semibold leading-snug">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#D97A7A]/30 bg-[#D97A7A]/10">
            <ReceiptText className="h-5 w-5 text-[#D97A7A]" />
          </span>
          <span className="font-mono text-xs font-bold break-all">{order.invoiceNumber}</span>
        </span>
        <BadgeGroup status={order.status} payment={order.paymentStatus} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Aksi pesanan"
              className="h-8 w-8 shrink-0 border border-black/10 bg-black/10 text-black hover:bg-[#D97A7A] hover:text-white"
            >
              <MoreVertical className="h-4 w-4" />
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-2 h-px w-full bg-black/15" />

      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-1 text-sm">
        <InfoRow icon={<UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="Nama:">
          {order.buyerName}
        </InfoRow>
        <InfoRow icon={<Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="HP:">
          {order.buyerPhone || "—"}
        </InfoRow>
        <InfoRow icon={<Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="Batch:">
          {order.batchName || "—"}
        </InfoRow>
        <InfoRow icon={<CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="Waktu:">
          {new Date(order.soldAt).toLocaleDateString("id-ID")}
        </InfoRow>
        <InfoRow icon={<CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="ETA:">
          {etaLabel(order.eta)}
        </InfoRow>
      </div>

      <div className="mt-2 h-px w-full bg-black/15" />

      <div className="mt-2 space-y-2.5">
        {order.items.map((it, i) => (
          <div key={i} className="flex items-start gap-1.5 text-sm">
            <div className="mt-[3px]">
              <ShoppingCart className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <span className="line-clamp-1 min-w-0 flex-1">{it.book.title}</span>
                <span className="shrink-0 font-bold">{formatIDR(it.unitPrice * it.quantity)}</span>
              </div>
              {it.book.formats.length > 0 && (
                <p className="mt-0.5 flex flex-wrap items-center gap-1">
                  {it.book.formats.map((f) => (
                    <span
                      key={f}
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${FORMAT_BADGE[f] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
                    >
                      {f}
                    </span>
                  ))}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {it.quantity} × {formatIDR(it.unitPrice)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 h-px w-full bg-black/15" />

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
        <SummaryCol icon={<Calculator className="h-3.5 w-3.5" />} title="Total">
          {formatIDR(order.total)}
        </SummaryCol>
        <SummaryCol icon={<Wallet className="h-3.5 w-3.5" />} title="DP">
          {formatIDR(order.dp ?? 0)}
        </SummaryCol>
        <SummaryCol icon={<PiggyBank className="h-3.5 w-3.5" />} title="Sisa">
          {formatIDR(order.remaining ?? 0)}
        </SummaryCol>
        <SummaryCol icon={<Truck className="h-3.5 w-3.5" />} title="Ongkir">
          {order.shippingCost != null ? formatIDR(order.shippingCost) : "—"}
        </SummaryCol>
        <SummaryCol icon={<Package className="h-3.5 w-3.5" />} title="No Resi">
          <span className="font-mono text-xs font-semibold">{order.trackingNumber || "—"}</span>
        </SummaryCol>
      </div>

      <BuyerOrderDetail order={order} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}

const TRACK_STATUSES = [
  "ORDER_PLACED",
  "SHIPPING_TO_INDONESIA",
  "ARRIVED_IN_INDONESIA",
  "ARRIVED_AT_WAREHOUSE",
  "SHIPPED_TO_CUSTOMER",
  "ORDER_DELIVERED",
];

function buildAdminWaText(order: OrderDTO): string {
  return `Halo Admin CuratedByDer,

Saya ${order.buyerName} ingin menanyakan terkait invoice pembelian berikut ${order.invoiceNumber}

Terimakasih`;
}

function openAdminWa(order: OrderDTO) {
  const link = waLink(ADMIN_WA, buildAdminWaText(order));
  if (link) window.open(link, "_blank");
}

function BuyerOrderDetail({
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
          <InfoRow icon={<UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="Nama:">
            {order.buyerName}
          </InfoRow>
          <InfoRow icon={<Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="HP:">
            {order.buyerPhone || "—"}
          </InfoRow>
          <InfoRow icon={<Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="Batch:">
            {order.batchName || "—"}
          </InfoRow>
          <InfoRow icon={<CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="Waktu:">
            {new Date(order.soldAt).toLocaleDateString("id-ID")}
          </InfoRow>
          <InfoRow icon={<CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="ETA:">
            {etaLabel(order.eta)}
          </InfoRow>
          <InfoRow icon={<Truck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="Ongkir:">
            {order.shippingCost != null ? formatIDR(order.shippingCost) : "—"}
          </InfoRow>
          <InfoRow icon={<Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="No Resi:">
            {order.trackingNumber || "—"}
          </InfoRow>
          <InfoRow icon={<ReceiptText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="Status:">
            {STATUS_LABEL[order.status] || order.status}
          </InfoRow>
          <InfoRow icon={<Wallet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />} title="Bayar:">
            {PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus}
          </InfoRow>
        </div>

        <div className="my-1 h-px w-full bg-black/15" />

        <div className="space-y-2 text-sm">
          {order.items.map((it, i) => (
            <div key={i} className="rounded-lg border p-2">
              <p className="flex flex-wrap items-center font-medium">{it.book.title}</p>
              {it.book.formats.length > 0 && (
                <p className="mt-0.5 flex flex-wrap items-center gap-1">
                  {it.book.formats.map((f) => (
                    <span
                      key={f}
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${FORMAT_BADGE[f] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
                    >
                      {f}
                    </span>
                  ))}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Qty: {it.quantity} · Harga: {formatIDR(it.unitPrice)}
              </p>
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
            onClick={() => window.open(`/api/download/orders/${order.id}`, "_blank")}
            className="flex-1"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => openAdminWa(order)}
            className="flex-1 border border-input bg-transparent text-black transition-colors hover:bg-[#D97A7A] hover:text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Hubungi Admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TrackCard({ order }: { order: OrderDTO }) {
  const done = TRACK_STATUSES.findIndex((x) => x === order.status);

  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: "#F6F1E7" }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 font-semibold leading-snug">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#D97A7A]/30 bg-[#D97A7A]/10">
            <Truck className="h-5 w-5 text-[#D97A7A]" />
          </span>
          <span className="font-mono text-xs font-bold break-all">{order.invoiceNumber}</span>
        </span>
        <BadgeGroup status={order.status} payment={order.paymentStatus} />
      </div>

      <div className="mb-2 h-px w-full bg-black/15" />

      {order.eta && (
        <div className="flex items-center gap-1.5 text-sm">
          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="w-16 shrink-0 text-muted-foreground">ETA:</span>
          <span className="text-black/80">{etaLabel(order.eta)}</span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1 text-xs">
        {TRACK_STATUSES.map((sv, i) => {
          const reached = i <= done;
          return (
            <div key={sv} className="flex items-center gap-1">
              <span
                className={`whitespace-nowrap rounded-full px-2 py-1 ${
                  reached ? "bg-[#D97A7A] text-white" : "bg-black/10 text-black/50"
                }`}
              >
                {STATUS_LABEL[sv]}
              </span>
              {i < TRACK_STATUSES.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BuyerTabs({ orders }: { orders: OrderDTO[] }) {
  return (
    <Tabs defaultValue="invoice">
      <TabsList className="w-full">
        <TabsTrigger value="invoice" className="flex-1 gap-1.5">
          <FileText className="h-4 w-4" />
          Invoice
        </TabsTrigger>
        <TabsTrigger value="shipment" className="flex-1 gap-1.5">
          <Search className="h-4 w-4" />
          Lacak
        </TabsTrigger>
      </TabsList>

      <TabsContent value="invoice" className="mt-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((s) => (
              <OrderCard key={s.id} order={s} />
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
    </Tabs>
  );
}