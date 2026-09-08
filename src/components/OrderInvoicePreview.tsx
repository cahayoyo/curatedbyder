"use client";

import { ArrowDownToLine, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAYMENT_BADGE, PAYMENT_STATUSES } from "@/lib/orderOptions";
import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/format";

export type InvoicePreviewItem = {
  key: string;
  title: string;
  caption: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export function OrderInvoicePreview({
  invoiceNumber,
  date,
  statusValue,
  items,
  subtotal,
  shippingCost,
  dp,
  dpLabel,
  total,
}: {
  invoiceNumber: string | null;
  date: Date;
  statusValue: string;
  items: InvoicePreviewItem[];
  subtotal: number;
  shippingCost: number;
  dp: number;
  dpLabel: string;
  total: number;
}) {
  const status = PAYMENT_STATUSES.find((p) => p.value === statusValue);

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D97A7A]/30 bg-[#D97A7A]/10">
          <ReceiptText className="h-4 w-4 text-[#D97A7A]" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight">Invoice</p>
          <p className="truncate text-xs text-muted-foreground">Review order pesanan Anda.</p>
        </div>
      </div>

      <div className="space-y-1.5 rounded-lg border border-input bg-[#FCFBFB] p-2.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="shrink-0 text-muted-foreground">No. Invoice</span>
          <span
            className={cn(
              "break-all text-right text-[11px] font-semibold",
              invoiceNumber ? "font-mono" : "italic text-muted-foreground"
            )}
          >
            {invoiceNumber ?? "Otomatis setelah disimpan"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="shrink-0 text-muted-foreground">Tanggal</span>
          <span className="shrink-0">
            {date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="shrink-0 text-muted-foreground">Status</span>
          <span
            className={cn(
              "shrink-0 rounded-full border px-1.5 py-px text-[10px] font-semibold",
              PAYMENT_BADGE[statusValue] ?? "border-gray-300 bg-gray-100 text-gray-700"
            )}
          >
            {status?.label ?? statusValue}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-semibold">Rincian Item</p>
        <div className="grid grid-cols-[minmax(0,1fr)_30px_74px_84px] gap-x-2 px-0.5 text-[11px] font-medium text-muted-foreground">
          <span>Produk</span>
          <span>Qty</span>
          <span>Harga</span>
          <span className="text-right">Subtotal</span>
        </div>
        <div className="max-h-52 space-y-1.5 overflow-y-auto">
          {items.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">Belum ada produk.</p>
          ) : (
            items.map((it) => (
              <div
                key={it.key}
                className="grid grid-cols-[minmax(0,1fr)_30px_74px_84px] items-start gap-x-2 px-0.5 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium leading-snug">{it.title}</p>
                  <p className="truncate text-[11px] leading-snug text-muted-foreground">
                    {it.caption}
                  </p>
                </div>
                <span>{it.quantity}</span>
                <span className="truncate">{formatIDR(it.unitPrice)}</span>
                <span className="text-right font-medium">{formatIDR(it.subtotal)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-1 border-t border-input pt-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatIDR(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Ongkir</span>
          <span>{formatIDR(shippingCost)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{dpLabel}</span>
          <span>{formatIDR(dp)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-md bg-[#D97A7A]/10 px-3 py-2 text-sm font-bold text-[#c96666]">
        <span>Total</span>
        <span>{formatIDR(total)}</span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-[#D97A7A] bg-transparent text-[#D97A7A] transition-colors hover:bg-[#D97A7A] hover:text-white"
      >
        <ArrowDownToLine className="h-4 w-4" />
        Download Invoice
      </Button>
    </div>
  );
}
