"use client";

import { useMemo, useState, useTransition } from "react";
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
import { ETAS, STATUSES, PAYMENT_STATUSES, FORMAT_BADGE } from "@/lib/orderOptions";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatIDR, formatRp } from "@/lib/format";

type Buyer = { id: string; name: string };
type Book = { id: string; title: string; price: number; stock: number; formats?: string[] };
type Batch = { id: string; name: string };
type BatchPrice = { batchId: string; bookId: string; price: number; formats?: string[] };
type LineItem = { bookId: string; quantity: string; unitPrice?: number };

type OrderInitial = {
  id: string;
  invoiceNumber: string;
  buyerId: string;
  batchId: string;
  status: string;
  eta: string;
  dp: number | null;
  shippingCost: number | null;
  trackingNumber: string | null;
  paymentStatus: "NO_PAYMENT" | "LUNAS" | "DONE_DP";
  items: { bookId: string; quantity: number }[];
};

const btn =
  "flex-1 border border-input bg-transparent text-black transition-colors hover:bg-[#FED6D6] hover:text-black";

function SearchSelect({
  options,
  value,
  onValueChange,
  placeholder,
  triggerClassName,
}: {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  triggerClassName?: string;
}) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        onValueChange(v);
        setSearch("");
      }}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="sticky top-0 z-10 border-b border-input bg-popover p-1">
          <Input
            autoFocus
            placeholder={`Cari ${placeholder.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-8"
          />
        </div>
        {filtered.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">Tidak ada hasil</p>
        ) : (
          filtered.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export function OrderForm({
  buyers,
  books,
  batches,
  initial,
  batchPrices = [],
}: {
  buyers: Buyer[];
  books: Book[];
  batches: Batch[];
  initial?: OrderInitial;
  batchPrices?: BatchPrice[];
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [pending, startTransition] = useTransition();
  const [buyerId, setBuyerId] = useState(initial?.buyerId ?? "");
  const [batchId, setBatchId] = useState<string>(initial?.batchId ?? "");
  const [eta, setEta] = useState(initial?.eta ?? "");
  const [dp, setDp] = useState(initial?.dp != null ? String(initial.dp) : "");
  const [shippingCost, setShippingCost] = useState(
    initial?.shippingCost != null ? String(initial.shippingCost) : ""
  );
  const [trackingNumber, setTrackingNumber] = useState(
    initial?.trackingNumber ?? ""
  );
  const [paymentStatus, setPaymentStatus] = useState<string>(
    initial?.paymentStatus ?? "NO_PAYMENT"
  );
  const [status, setStatus] = useState<string>(initial?.status ?? "ORDER_PLACED");
  const [items, setItems] = useState<LineItem[]>(
    initial?.items?.length
      ? initial.items.map((it) => ({
          bookId: it.bookId,
          quantity: String(it.quantity),
          unitPrice: batchPrices.find((bp) => bp.batchId === initial.batchId && bp.bookId === it.bookId)?.price ??
            books.find((b) => b.id === it.bookId)?.price,
        }))
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

  const bookVariants = useMemo(() => {
    const batchNameMap2 = new Map(batches.map((b) => [b.id, b.name]));
    const out: {
      value: string;
      bookId: string;
      unitPrice: number;
      label: string;
      formats: string[];
    }[] = [];
    for (const book of books) {
      out.push({
        value: `${book.id}::${book.price}`,
        bookId: book.id,
        unitPrice: book.price,
        label: `${book.title} (stok ${book.stock})`,
        formats: book.formats ?? [],
      });
      for (const bp of batchPrices.filter((x) => x.bookId === book.id)) {
        const batchName = batchNameMap2.get(bp.batchId) ?? "Batch";
        out.push({
          value: `${book.id}::${bp.price}`,
          bookId: book.id,
          unitPrice: bp.price,
          label: `${book.title} · ${batchName} (stok ${book.stock})`,
          formats: bp.formats ?? [],
        });
      }
    }
    return out;
  }, [books, batchPrices, batches]);

  const bookVariantMap = new Map(bookVariants.map((v) => [v.value, v]));
  const bookOptionForItem = (item: LineItem) =>
    bookVariants.find(
      (v) =>
        v.bookId === item.bookId &&
        (item.unitPrice == null || v.unitPrice === item.unitPrice)
    );

  function bookPrice(item: LineItem) {
    if (item.unitPrice != null) return item.unitPrice;
    const batchPrice = batchPrices.find((bp) => bp.batchId === batchId && bp.bookId === item.bookId);
    if (batchPrice) return batchPrice.price;
    return books.find((b) => b.id === item.bookId)?.price ?? 0;
  }

  const bookTotal = items.reduce((acc, it) => {
    const qty = Number(it.quantity) || 0;
    return acc + bookPrice(it) * qty;
  }, 0);
  const shippingCostNum = shippingCost ? Number(shippingCost) : 0;
  const total = bookTotal + shippingCostNum;
  const autoDp = Math.round(total * 0.3);
  const effectiveDp = isEdit ? (dp ? Number(dp) : null) : total > 0 ? autoDp : null;
  const remaining = effectiveDp ? Math.max(0, total - effectiveDp) : null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const itemPayload = items
      .filter((i) => i.bookId)
      .map((i) => ({ bookId: i.bookId, quantity: Number(i.quantity), unitPrice: bookPrice(i) }));

    if (!buyerId) return toast.error("Nama/buyer wajib dipilih");
    if (!batchId) return toast.error("Batch wajib dipilih");
    if (!eta) return toast.error("ETA wajib dipilih");
    if (!paymentStatus) return toast.error("Status pembayaran wajib dipilih");
    if (!status) return toast.error("Status order wajib dipilih");
    if (itemPayload.length === 0) return toast.error("Pilih minimal satu buku");
    const hasEmptyBook = items.some((i) => !i.bookId);
    if (hasEmptyBook) return toast.error("Semua baris buku wajib diisi");

    startTransition(async () => {
      try {
        const payload = {
          buyerId,
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
          dp: effectiveDp,
          shippingCost: shippingCost ? Number(shippingCost) : null,
          trackingNumber: trackingNumber.trim() || null,
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

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-3">
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
          <SearchSelect
            options={buyers.map((b) => ({ value: b.id, label: b.name }))}
            value={buyerId}
            onValueChange={setBuyerId}
            placeholder="Select buyer"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Buku</Label>
        {items.map((item, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded-lg border border-input bg-white/50 p-3 sm:grid sm:grid-cols-[1fr_110px_90px_110px_auto] sm:items-end sm:gap-2 sm:space-y-0 sm:border-0 sm:bg-transparent sm:p-0"
          >
            <div className="min-w-0 space-y-1">
              <span className="text-xs text-muted-foreground">Judul Buku</span>
              <SearchSelect
                options={bookVariants.map((v) => ({ value: v.value, label: v.label }))}
                value={bookOptionForItem(item)?.value ?? ""}
                onValueChange={(v) => {
                  const variant = bookVariantMap.get(v);
                  if (variant) {
                    updateItem(idx, {
                      bookId: variant.bookId,
                      unitPrice: variant.unitPrice,
                    });
                  }
                }}
                placeholder="Select book"
                triggerClassName="w-full min-w-0 truncate"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Format</span>
              <div className="flex h-9 min-w-0 items-center gap-1 overflow-x-auto rounded-md border border-input bg-black/5 px-2">
                {(bookOptionForItem(item)?.formats ?? []).length > 0 ? (
                  (bookOptionForItem(item)?.formats ?? []).map((f) => (
                    <span
                      key={f}
                      className={`inline-flex h-4 shrink-0 items-center rounded-full border px-1.5 text-[10px] font-medium leading-none ${FORMAT_BADGE[f] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
                    >
                      {f}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
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
                value={item.bookId ? formatIDR(bookPrice(item)) : "—"}
                className="bg-black/5 text-sm"
              />
            </div>
            {items.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(idx)}
                className="justify-self-end text-destructive sm:self-end"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="border border-input bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
        >
          <Plus className="h-4 w-4" /> Tambah Buku
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Total</Label>
          <Input readOnly value={formatIDR(total)} className="bg-black/5" />
        </div>
        <div className="space-y-1.5">
          <Label>
            DP{" "}
            {!isEdit && (
              <span className="text-xs text-muted-foreground">
                (Perhitungan DP 30% dari Harga Total)
              </span>
            )}
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/60">
              Rp
            </span>
            <Input
              inputMode="numeric"
              readOnly={!isEdit}
              disabled={!isEdit}
              className={`pl-10 placeholder:text-black/30 ${!isEdit ? "bg-black/5" : ""}`}
              value={isEdit ? (dp ? formatRp(dp) : "") : effectiveDp ? formatRp(String(effectiveDp)) : ""}
              onChange={(e) => setDp(e.target.value.replace(/\D/g, ""))}
              placeholder={isEdit ? "Masukkan jika menggunakan DP..." : "Auto 30%"}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Remaining</Label>
          <Input readOnly value={remaining != null ? formatIDR(remaining) : "—"} className="bg-black/5" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Ongkir</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/60">
              Rp
            </span>
            <Input
              inputMode="numeric"
              className="pl-10 placeholder:text-black/30"
              value={shippingCost ? formatRp(shippingCost) : ""}
              onChange={(e) => setShippingCost(e.target.value.replace(/\D/g, ""))}
              placeholder="Masukkan ongkir..."
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Nomor Resi</Label>
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Masukkan nomor resi..."
          />
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
          <Label>Status Pesanan</Label>
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
        <Button
          type="submit"
          disabled={pending}
          className="flex-1 border border-input bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
        >
          {pending ? "Menyimpan..." : initial?.id ? "Ubah Pesanan" : "Buat Pesanan"}
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