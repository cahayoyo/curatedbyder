"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder, updateOrder } from "@/server/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOURCES, ETAS, STATUSES, PAYMENT_STATUSES } from "@/lib/orderOptions";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Buyer = { id: string; name: string };
type Book = { id: string; title: string; price: number; stock: number };
type Batch = { id: string; name: string };
type LineItem = { bookId: string; quantity: string };

type OrderInitial = {
  id: string;
  invoiceNumber: string;
  buyerId: string;
  source: "INSTAGRAM" | "SHOPEE" | "OTHER";
  batchId: string;
  status: string;
  eta: string;
  dp: number | null;
  paymentStatus: "NO_PAYMENT" | "LUNAS" | "DONE_DP";
  items: { bookId: string; quantity: number }[];
};

const btn =
  "flex-1 border border-input bg-transparent text-black transition-colors hover:bg-[#FED6D6] hover:text-black";

export function OrderForm({
  buyers,
  books,
  batches,
  initial,
}: {
  buyers: Buyer[];
  books: Book[];
  batches: Batch[];
  initial?: OrderInitial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [buyerId, setBuyerId] = useState(initial?.buyerId ?? "");
  const [source, setSource] = useState<string>(initial?.source ?? "INSTAGRAM");
  const [batchId, setBatchId] = useState<string>(initial?.batchId ?? "");
  const [eta, setEta] = useState(initial?.eta ?? "");
  const [dp, setDp] = useState(initial?.dp != null ? String(initial.dp) : "");
  const [paymentStatus, setPaymentStatus] = useState<string>(
    initial?.paymentStatus ?? "NO_PAYMENT"
  );
  const [status, setStatus] = useState<string>(initial?.status ?? "ORDER_PLACED");
  const [items, setItems] = useState<LineItem[]>(
    initial?.items?.length
      ? initial.items.map((it) => ({ bookId: it.bookId, quantity: String(it.quantity) }))
      : [{ bookId: "", quantity: "1" }]
  );

  function addItem() {
    setItems((i) => [...i, { bookId: "", quantity: "1" }]);
  }
  function removeItem(idx: number) {
    setItems((i) => i.filter((_, n) => n !== idx));
  }
  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((i) => i.map((it, n) => (n === idx ? { ...it, ...patch } : it)));
  }

  function bookPrice(bookId: string) {
    return books.find((b) => b.id === bookId)?.price ?? 0;
  }

  const total = items.reduce((acc, it) => {
    const qty = Number(it.quantity) || 0;
    return acc + bookPrice(it.bookId) * qty;
  }, 0);
  const dpNum = dp ? Number(dp) : 0;
  const remaining = dpNum > 0 ? Math.max(0, total - dpNum) : null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const itemPayload = items
      .filter((i) => i.bookId)
      .map((i) => ({ bookId: i.bookId, quantity: Number(i.quantity) }));

    if (!buyerId) return toast.error("Nama/buyer wajib dipilih");
    if (!batchId) return toast.error("Batch wajib dipilih");
    if (!eta) return toast.error("ETA wajib dipilih");
    if (!source) return toast.error("Source wajib dipilih");
    if (!paymentStatus) return toast.error("Status pembayaran wajib dipilih");
    if (!status) return toast.error("Status order wajib dipilih");
    if (itemPayload.length === 0) return toast.error("Pilih minimal satu buku");
    const hasEmptyBook = items.some((i) => !i.bookId);
    if (hasEmptyBook) return toast.error("Semua baris buku wajib diisi");

    startTransition(async () => {
      try {
        const payload = {
          buyerId,
          source: source as "INSTAGRAM" | "SHOPEE" | "OTHER",
          batchId,
          eta: eta as
            | "JAN"
            | "FEB"
            | "MAR"
            | "APR"
            | "MAY"
            | "JUN"
            | "JUL"
            | "AUG"
            | "SEP"
            | "OCT"
            | "NOV"
            | "DEC",
          dp: dp ? Number(dp) : null,
          paymentStatus: paymentStatus as "NO_PAYMENT" | "LUNAS" | "DONE_DP",
          status: status as
            | "ORDER_PLACED"
            | "SHIPPING_TO_INDONESIA"
            | "ARRIVED_IN_INDONESIA"
            | "ARRIVED_AT_WAREHOUSE"
            | "SHIPPED_TO_CUSTOMER"
            | "ORDER_DELIVERED",
          items: itemPayload,
        };
        if (initial?.id) {
          await updateOrder(initial.id, payload);
          toast.success("Order diubah");
        } else {
          const order = await createOrder(payload);
          toast.success(`Order recorded: ${order.invoiceNumber}`);
        }
        router.push("/admin/orders");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to record order");
      }
    });
  }

  function fmtRupiah(n: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
  }

  function formatRp(digits: string): string {
    const clean = digits.replace(/\D/g, "");
    if (!clean) return "";
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Batch</Label>
          <Select value={batchId} onValueChange={setBatchId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>ETA</Label>
          <Select value={eta} onValueChange={setEta}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih bulan" />
            </SelectTrigger>
            <SelectContent>
              {ETAS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Nama</Label>
          <Select value={buyerId} onValueChange={setBuyerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select buyer" />
            </SelectTrigger>
            <SelectContent>
              {buyers.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Source</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Buku</Label>
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_90px_110px_auto] items-center gap-2">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Judul Buku</span>
              <Select value={item.bookId} onValueChange={(v) => updateItem(idx, { bookId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select book" />
                </SelectTrigger>
                <SelectContent>
                  {books.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title} ({b.stock} left)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Quantity</span>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(idx, { quantity: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Harga</span>
              <Input
                readOnly
                value={item.bookId ? fmtRupiah(bookPrice(item.bookId)) : "—"}
                className="bg-black/5 text-sm"
              />
            </div>
            {items.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(idx)}
                className="self-end text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <div className="w-9" />
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addItem} className={btn}>
          <Plus className="h-4 w-4" /> Tambah Buku
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Total</Label>
          <Input readOnly value={fmtRupiah(total)} className="bg-black/5" />
        </div>
        <div className="space-y-1.5">
          <Label>DP</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/60">
              Rp
            </span>
            <Input
              inputMode="numeric"
              className="pl-10 placeholder:text-black/30"
              value={dp ? formatRp(dp) : ""}
              onChange={(e) => setDp(e.target.value.replace(/\D/g, ""))}
              placeholder="Masukkan jika menggunakan DP..."
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Remaining</Label>
          <Input readOnly value={remaining != null ? fmtRupiah(remaining) : "—"} className="bg-black/5" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Status Pembayaran</Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status Order</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending} className={cn("flex-1 border border-input", btn)}>
          {pending ? "Menyimpan..." : initial?.id ? "Ubah Order" : "Buat Order"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className={cn("flex-1 border border-input", btn)}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}