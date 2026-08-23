"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, PAYMENT_LABEL, PAYMENT_BADGE, STATUS_BADGE } from "@/lib/orderOptions";
import { formatIDR } from "@/lib/format";
import {
  Calculator,
  CalendarClock,
  FileText,
  PiggyBank,
  ReceiptText,
  Search,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";

type OrderItemDTO = {
  quantity: number;
  unitPrice: number;
  book: { title: string };
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
  items: OrderItemDTO[];
};

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

function SummaryRow({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1 text-xs text-black/60">
        {icon}
        <span>{title}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function OrderCard({ order }: { order: OrderDTO }) {
  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 font-semibold leading-snug">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#D97A7A]/30 bg-[#D97A7A]/10">
            <ReceiptText className="h-5 w-5 text-[#D97A7A]" />
          </span>
          <span className="font-mono text-xs font-bold break-all">{order.invoiceNumber}</span>
        </span>
        <BadgeGroup status={order.status} payment={order.paymentStatus} />
      </div>

      <div className="mb-2 h-px w-full bg-black/15" />

      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-1 text-sm">
        <div className="flex min-w-0 items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="w-16 shrink-0 text-muted-foreground">Waktu:</span>
          <span className="line-clamp-1 min-w-0 flex-1 text-black/80">
            {new Date(order.soldAt).toLocaleDateString("id-ID")}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="w-16 shrink-0 text-muted-foreground">ETA:</span>
          <span className="line-clamp-1 min-w-0 flex-1 text-black/80">{order.eta ?? "—"}</span>
        </div>
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
              <p className="text-[11px] text-muted-foreground">
                {it.quantity} × {formatIDR(it.unitPrice)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 h-px w-full bg-black/15" />

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
        <SummaryRow icon={<Calculator className="h-3.5 w-3.5" />} title="Total" value={formatIDR(order.total)} />
        <SummaryRow icon={<Wallet className="h-3.5 w-3.5" />} title="DP" value={formatIDR(order.dp ?? 0)} />
        <SummaryRow icon={<PiggyBank className="h-3.5 w-3.5" />} title="Sisa" value={formatIDR(order.remaining ?? 0)} />
      </div>
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

function TrackCard({ order }: { order: OrderDTO }) {
  return (
    <div className="rounded-lg border p-3 bg-white">
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
          <span className="text-black/80">{order.eta}</span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1 text-xs">
        {TRACK_STATUSES.map((sv, i) => {
          const done = TRACK_STATUSES.findIndex((x) => x === order.status);
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
        <TabsTrigger value="payment" className="flex-1 gap-1.5">
          <Wallet className="h-4 w-4" />
          Pembayaran
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

      <TabsContent value="payment" className="mt-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
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