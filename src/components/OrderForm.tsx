"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { capture } from "@/lib/posthog";
import {
  addOrderPayment,
  createOrder,
  deleteOrderPayment,
  updateOrder,
  updateOrderDp,
  updateOrderPayment,
} from "@/server/actions/orders";
import { BookImagePicker } from "@/components/BookImagePicker";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { OrderInvoicePreview } from "@/components/OrderInvoicePreview";
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
import { ETAS, PAYMENT_STATUSES, PAYMENT_BADGE, FORMAT_BADGE } from "@/lib/orderOptions";
import { Plus, Trash2, Save, X, UserRound, Truck, Package, PiggyBank, Wallet, Calculator, ShieldCheck, Pencil } from "lucide-react";
import { useSuccessModal } from "@/components/SuccessModal";
import { cn, stockBadgeClass } from "@/lib/utils";
import { formatIDR, formatRp } from "@/lib/format";

type Buyer = { id: string; name: string };
type Book = { id: string; title: string; price: number; stock: number; formats?: string[] };
type Toy = { id: string; title: string; price: number; stock: number };
type Batch = { id: string; name: string };
type BatchPrice = { batchId: string; bookId: string; price: number; formats?: string[] };
type LineItem = {
  kind: "book" | "toy";
  bookId: string;
  toyId: string;
  batchId: string;
  eta: string;
  quantity: string;
  unitPrice?: number;
  variantKey?: string;
};

const emptyLine = (): LineItem => ({
  kind: "book",
  bookId: "",
  toyId: "",
  batchId: "",
  eta: "",
  quantity: "1",
});

const toDateInput = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

type OrderInitial = {
  id: string;
  invoiceNumber: string;
  buyerId: string;
  dp: number | null;
  dpProofUrl: string | null;
  shippingCost: number | null;
  trackingNumber: string | null;
  paymentStatus: "NO_PAYMENT" | "LUNAS" | "DONE_DP";
  payments: {
    id: string;
    amount: number;
    proofUrl: string | null;
    note: string | null;
    paidAt: Date;
  }[];
  items: {
    bookId?: string | null;
    toyId?: string | null;
    batchId: string;
    eta: string;
    quantity: number;
    unitPrice?: number | null;
  }[];
};

const btn =
  "flex-1 border border-input bg-transparent text-black transition-colors hover:bg-[#FED6D6] hover:text-black";

function roman(n: number): string {
  const map: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

function SectionHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D97A7A] text-xs font-bold text-white">
        {n}
      </span>
      <h3 className="text-base font-bold">{title}</h3>
    </div>
  );
}

function SearchSelect({
  options,
  value,
  onValueChange,
  placeholder,
  triggerClassName,
  leftIcon,
}: {
  options: { value: string; label: string; stock?: number }[];
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  triggerClassName?: string;
  leftIcon?: React.ReactNode;
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
      <SelectTrigger className={cn("gap-1.5", triggerClassName)}>
        {leftIcon}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="w-[var(--radix-select-trigger-width)]">
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
              <span className="whitespace-normal break-words leading-snug">{o.label}</span>
              {o.stock != null && (
                <span
                  className={cn(
                    "ml-1 shrink-0 whitespace-nowrap rounded border px-1 text-[11px] font-semibold",
                    stockBadgeClass(o.stock)
                  )}
                >
                  Stok : {o.stock}
                </span>
              )}
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
  toys = [],
  batches,
  initial,
  batchPrices = [],
}: {
  buyers: Buyer[];
  books: Book[];
  toys?: Toy[];
  batches: Batch[];
  initial?: OrderInitial;
  batchPrices?: BatchPrice[];
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [pending, startTransition] = useTransition();
  const { success, error } = useSuccessModal();
  const [buyerId, setBuyerId] = useState(initial?.buyerId ?? "");
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
  const [showPayForm, setShowPayForm] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payProof, setPayProof] = useState("");
  const [payNote, setPayNote] = useState("");
  const [dpProofUrl, setDpProofUrl] = useState(initial?.dpProofUrl ?? "");
  const [editingDp, setEditingDp] = useState(false);
  const [dpAmountDraft, setDpAmountDraft] = useState("");
  const [dpProofDraft, setDpProofDraft] = useState("");
  const [items, setItems] = useState<LineItem[]>(
    initial?.items?.length
      ? initial.items.map((it) => ({
          kind: it.toyId ? ("toy" as const) : ("book" as const),
          bookId: it.bookId ?? "",
          toyId: it.toyId ?? "",
          batchId: it.batchId,
          eta: it.eta,
          quantity: String(it.quantity),
          unitPrice: it.unitPrice ?? undefined,
        }))
      : [emptyLine()]
  );

  function addItem() {
    setItems((i) => [...i, emptyLine()]);
  }
  function removeItem(idx: number) {
    setItems((i) => i.filter((_, n) => n !== idx));
  }
  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((i) => i.map((it, n) => (n === idx ? { ...it, ...patch } : it)));
  }

  function setItemKind(idx: number, kind: "book" | "toy") {
    setItems((i) =>
      i.map((it, n) =>
        n === idx
          ? { ...it, kind, bookId: "", toyId: "", unitPrice: undefined, variantKey: undefined }
          : it
      )
    );
  }

  const bookVariants = useMemo(() => {
    const batchNameMap2 = new Map(batches.map((b) => [b.id, b.name]));
    const out: {
      value: string;
      bookId: string;
      unitPrice: number;
      label: string;
      stock: number;
      formats: string[];
    }[] = [];
    for (const book of books) {
      out.push({
        value: `${book.id}::base::${book.price}`,
        bookId: book.id,
        unitPrice: book.price,
        label: book.title,
        stock: book.stock,
        formats: book.formats ?? [],
      });
      for (const bp of batchPrices.filter((x) => x.bookId === book.id)) {
        const batchName = batchNameMap2.get(bp.batchId) ?? "Batch";
        out.push({
          value: `${book.id}::bp::${bp.batchId}::${bp.price}`,
          bookId: book.id,
          unitPrice: bp.price,
          label: `${book.title} · ${batchName}`,
          stock: book.stock,
          formats: bp.formats ?? [],
        });
      }
    }
    return out;
  }, [books, batchPrices, batches]);

  const bookVariantMap = new Map(bookVariants.map((v) => [v.value, v]));
  const bookOptionForItem = (item: LineItem) => {
    const matches = bookVariants.filter(
      (v) =>
        v.bookId === item.bookId &&
        (item.unitPrice == null || v.unitPrice === item.unitPrice)
    );
    return (
      matches.find((v) => item.batchId && v.value.includes(`::bp::${item.batchId}::`)) ??
      matches[0]
    );
  };

  const toyVariants = useMemo(() => {
    return toys.map((t) => ({
      value: `toy:${t.id}::${t.price}`,
      toyId: t.id,
      unitPrice: t.price,
      label: t.title,
      stock: t.stock,
    }));
  }, [toys]);

  const toyVariantMap = new Map(toyVariants.map((v) => [v.value, v]));
  const toyOptionForItem = (item: LineItem) =>
    toyVariants.find(
      (v) =>
        v.toyId === item.toyId &&
        (item.unitPrice == null || v.unitPrice === item.unitPrice)
    );

  function bookPrice(item: LineItem) {
    if (item.unitPrice != null) return item.unitPrice;
    const batchPrice = batchPrices.find((bp) => bp.batchId === item.batchId && bp.bookId === item.bookId);
    if (batchPrice) return batchPrice.price;
    return books.find((b) => b.id === item.bookId)?.price ?? 0;
  }

  function itemPrice(item: LineItem) {
    if (item.kind === "toy") {
      if (item.unitPrice != null) return item.unitPrice;
      return toys.find((t) => t.id === item.toyId)?.price ?? 0;
    }
    return bookPrice(item);
  }

  function itemFormatsOf(item: LineItem): string[] {
    if (item.kind === "toy") return [];
    return bookOptionForItem(item)?.formats ?? [];
  }

  const productTotal = items.reduce((acc, it) => {
    const qty = Number(it.quantity) || 0;
    return acc + itemPrice(it) * qty;
  }, 0);
  const shippingCostNum = shippingCost ? Number(shippingCost) : 0;
  const total = productTotal + shippingCostNum;
  const autoDp = Math.round(total * 0.3);
  const effectiveDp = isEdit ? (dp ? Number(dp) : 0) : total > 0 ? autoDp : 0;
  const payments = initial?.payments ?? [];
  const paidSum = payments.reduce((n, p) => n + p.amount, 0);
  const remaining = Math.max(0, total - effectiveDp - paidSum);

  const previewItems = items
    .filter((i) => (i.kind === "book" ? i.bookId : i.toyId))
    .map((i, n) => {
      const title =
        i.kind === "book"
          ? books.find((b) => b.id === i.bookId)?.title ?? "—"
          : toys.find((t) => t.id === i.toyId)?.title ?? "—";
      const fmts = itemFormatsOf(i);
      const caption =
        i.kind === "toy" ? "Mainan" : fmts.length ? `Format: ${fmts.join(", ")}` : "Buku";
      const qty = Number(i.quantity) || 0;
      const price = itemPrice(i);
      return {
        key: `${i.kind}-${i.bookId || i.toyId}-${n}`,
        title,
        caption,
        quantity: qty,
        unitPrice: price,
        subtotal: qty * price,
      };
    });

  function submitDpEdit() {
    if (!initial?.id) return;
    const amount = Number(dpAmountDraft);
    if (!Number.isInteger(amount) || amount < 0) return error("Jumlah pembayaran tidak valid");
    if (amount > total - paidSum) {
      return error(`Pembayaran I melebihi batas (${formatIDR(Math.max(0, total - paidSum))})`);
    }
    startTransition(async () => {
      try {
        const res = await updateOrderDp(initial.id, {
          amount,
          proofUrl: dpProofDraft || null,
        });
        if (!res.ok) {
          error(res.error);
          return;
        }
        success("Pembayaran I berhasil diubah!");
        capture("order_dp_updated", { amount, has_proof: Boolean(dpProofDraft) });
        setDp(dpAmountDraft);
        setDpProofUrl(dpProofDraft);
        setEditingDp(false);
        router.refresh();
      } catch (err) {
        error(err instanceof Error ? err.message : "Gagal mengubah pembayaran");
      }
    });
  }

  function openAddPayment() {
    setEditingPaymentId(null);
    setPayAmount("");
    setPayDate(toDateInput(new Date()));
    setPayNote("");
    setPayProof("");
    setShowPayForm(true);
  }

  function openEditPayment(id: string) {
    const p = payments.find((x) => x.id === id);
    if (!p) return;
    setEditingPaymentId(id);
    setPayAmount(String(p.amount));
    setPayDate(toDateInput(new Date(p.paidAt)));
    setPayNote(p.note ?? "");
    setPayProof(p.proofUrl ?? "");
    setShowPayForm(true);
  }

  function closePayForm() {
    setShowPayForm(false);
    setEditingPaymentId(null);
    setPayAmount("");
    setPayDate("");
    setPayNote("");
    setPayProof("");
  }

  function submitPayment() {
    if (!initial?.id) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return error("Jumlah pembayaran wajib diisi");
    const editing = editingPaymentId
      ? payments.find((p) => p.id === editingPaymentId)
      : undefined;
    const maxSpend = editing ? remaining + editing.amount : remaining;
    if (amount > maxSpend) {
      return error(`Jumlah pembayaran melebihi sisa tagihan (${formatIDR(maxSpend)})`);
    }
    startTransition(async () => {
      try {
        const payload = {
          amount,
          proofUrl: payProof || null,
          note: payNote || null,
          paidAt: payDate ? new Date(`${payDate}T00:00:00`) : null,
        };
        const res = editingPaymentId
          ? await updateOrderPayment(editingPaymentId, payload)
          : await addOrderPayment(initial.id, payload);
        if (!res.ok) {
          error(res.error);
          return;
        }
        success(editingPaymentId ? "Pembayaran berhasil diubah!" : "Pembayaran berhasil dicatat!");
        if (!editingPaymentId) {
          capture("order_payment_added", { amount, has_proof: Boolean(payProof) });
        }
        closePayForm();
        router.refresh();
      } catch (err) {
        error(err instanceof Error ? err.message : "Gagal mencatat pembayaran");
      }
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const itemPayload = items
      .filter((i) => i.kind === "book" ? i.bookId : i.toyId)
      .map((i) => ({
        bookId: i.kind === "book" ? i.bookId : undefined,
        toyId: i.kind === "toy" ? i.toyId : undefined,
        batchId: i.batchId,
        eta: i.eta as
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
        quantity: Number(i.quantity),
        unitPrice: itemPrice(i),
      }));

    if (!buyerId) return error("Nama/buyer wajib dipilih");
    if (!paymentStatus) return error("Status pembayaran wajib dipilih");
    if (itemPayload.length === 0) return error("Pilih minimal satu produk");
    const hasEmptyProduct = items.some((i) => (i.kind === "book" ? !i.bookId : !i.toyId));
    if (hasEmptyProduct) return error("Semua baris produk wajib diisi");
    if (items.some((i) => !i.batchId)) return error("Setiap baris produk wajib memilih batch");
    if (items.some((i) => !i.eta)) return error("Setiap baris produk wajib memilih ETA");

    startTransition(async () => {
      try {
        const payload = {
          buyerId,
          dp: effectiveDp,
          shippingCost: shippingCost ? Number(shippingCost) : null,
          trackingNumber: trackingNumber.trim() || null,
          paymentStatus: paymentStatus as "NO_PAYMENT" | "LUNAS" | "DONE_DP",
          items: itemPayload,
        };
        if (initial?.id) {
          const res = await updateOrder(initial.id, payload);
          if (!res.ok) {
            error(res.error);
            return;
          }
          success(`${initial?.invoiceNumber} berhasil diubah!`);
          capture("order_updated", {
            item_count: itemPayload.length,
            total,
            payment_status: paymentStatus,
            has_shipping_cost: shippingCostNum > 0,
          });
        } else {
          const res = await createOrder(payload);
          if (!res.ok) {
            error(res.error);
            return;
          }
          success(`${res.data.invoiceNumber} berhasil dibuat!`);
          capture("order_created", {
            item_count: itemPayload.length,
            total,
            payment_status: paymentStatus,
            has_shipping_cost: shippingCostNum > 0,
          });
        }
        router.push("/admin/orders");
        router.refresh();
      } catch (err) {
        error(err instanceof Error ? err.message : "Failed to record order");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px] xl:items-start">
        <div className="min-w-0 space-y-4 rounded-lg border bg-white p-4">
          <div className="space-y-3 rounded-lg border border-transparent p-4">
            <SectionHeader n={1} title="Informasi Pembeli" />
            <div className="space-y-1.5">
              <Label>Pilih Pembeli</Label>
              <SearchSelect
                options={buyers.map((b) => ({ value: b.id, label: b.name }))}
                value={buyerId}
                onValueChange={setBuyerId}
                placeholder="Cari Pembeli"
                leftIcon={<UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />}
              />
            </div>
          </div>

      <div className="space-y-3 rounded-lg border bg-[#FCFBFB] p-4">
        <SectionHeader n={2} title="Produk" />
        <div className="hidden gap-2 px-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[110px_1fr_90px_130px_110px_auto]">
          <span>Type</span>
          <span>Nama Produk</span>
          <span>Format</span>
          <span>Quantity</span>
          <span>Harga</span>
          <span />
        </div>
        {items.map((item, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded-lg border border-input bg-white/50 p-3 sm:grid sm:grid-cols-[110px_1fr_90px_130px_110px_auto] sm:items-end sm:gap-2 sm:space-y-0 sm:bg-transparent sm:p-3"
          >
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground sm:hidden">Type</span>
              <Select
                value={item.kind}
                onValueChange={(v) => setItemKind(idx, v as "book" | "toy")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="book">Buku</SelectItem>
                  <SelectItem value="toy">Mainan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-1">
              <span className="text-xs text-muted-foreground sm:hidden">Nama Produk</span>
              {item.kind === "book" ? (
                <SearchSelect
                  options={bookVariants.map((v) => ({ value: v.value, label: v.label, stock: v.stock }))}
                  value={item.variantKey ?? bookOptionForItem(item)?.value ?? ""}
                  onValueChange={(v) => {
                    const variant = bookVariantMap.get(v);
                    if (variant) {
                      updateItem(idx, {
                        bookId: variant.bookId,
                        toyId: "",
                        unitPrice: variant.unitPrice,
                        variantKey: v,
                      });
                    }
                  }}
                  placeholder="Select buku"
                  triggerClassName="w-full min-w-0 truncate"
                />
              ) : (
                <SearchSelect
                  options={toyVariants.map((v) => ({ value: v.value, label: v.label, stock: v.stock }))}
                  value={toyOptionForItem(item)?.value ?? ""}
                  onValueChange={(v) => {
                    const variant = toyVariantMap.get(v);
                    if (variant) {
                      updateItem(idx, {
                        toyId: variant.toyId,
                        bookId: "",
                        unitPrice: variant.unitPrice,
                        variantKey: v,
                      });
                    }
                  }}
                  placeholder="Select mainan"
                  triggerClassName="w-full min-w-0 truncate"
                />
              )}
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground sm:hidden">Format</span>
              <div className="flex h-9 min-w-0 items-center gap-1 overflow-x-auto rounded-md border border-input bg-black/5 px-2">
                {itemFormatsOf(item).length > 0 ? (
                  itemFormatsOf(item).map((f) => (
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
            <div className="space-y-2 sm:col-span-6 sm:col-start-1 sm:row-start-2 sm:flex sm:items-end sm:gap-2 sm:space-y-0">
              <div className="space-y-1 sm:w-fit sm:min-w-[228px]">
                <span className="text-xs text-muted-foreground">Batch</span>
                <Select
                  value={item.batchId}
                  onValueChange={(v) => updateItem(idx, { batchId: v, unitPrice: undefined, variantKey: undefined })}
                >
                  <SelectTrigger className="w-full min-w-0">
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
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">ETA</span>
                <Select value={item.eta} onValueChange={(v) => updateItem(idx, { eta: v })}>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder="Bulan" />
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
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground sm:hidden">Quantity</span>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(idx, { quantity: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground sm:hidden">Harga</span>
              <Input
                readOnly
                value={(item.kind === "book" ? item.bookId : item.toyId) ? formatIDR(itemPrice(item)) : "—"}
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
          className="w-full border-dashed border-[#D97A7A] bg-transparent text-[#D97A7A] transition-colors hover:bg-[#FED6D6]/40 hover:text-[#D97A7A] sm:w-fit"
        >
          <Plus className="h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-muted-foreground" />
            Ongkir
          </Label>
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
          <Label className="flex items-center gap-1.5">
            <Package className="h-4 w-4 text-muted-foreground" />
            Nomor Resi
          </Label>
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Masukkan nomor resi..."
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
            Sisa Tagihan
          </Label>
          <Input readOnly value={remaining != null ? formatIDR(remaining) : "—"} className="bg-black/5" />
          {isEdit && total > 0 && remaining === 0 && (
            <p className="text-xs font-semibold text-green-700">Sudah lunas</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            DP{" "}
            {!isEdit && (
              <span className="text-xs font-normal text-muted-foreground">
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
          <Label className="flex items-center gap-1.5">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            Total
          </Label>
          <Input readOnly value={formatIDR(total)} className="bg-black/5" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            Status Pembayaran
          </Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger
              className={cn(
                "font-medium",
                PAYMENT_BADGE[paymentStatus] ?? "border-gray-300 bg-gray-100 text-gray-700"
              )}
            >
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
      </div>

      {isEdit && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Pembayaran (Cicilan)
          </Label>

          {payments.length === 0 && !showPayForm && (
            <p className="rounded-lg border border-dashed border-input p-3 text-sm text-muted-foreground">
              Belum ada pembayaran cicilan.
            </p>
          )}

          <div className="grid gap-2 md:grid-cols-2">
            <div className="flex min-h-24 flex-col justify-between gap-2 rounded-lg border border-input bg-white/50 p-2.5">
              <div className="flex min-h-9 flex-wrap items-center gap-2">
                <span className="shrink-0 rounded border border-[#D97A7A]/40 bg-[#FED6D6]/50 px-2 py-0.5 text-xs font-semibold text-[#D97A7A]">
                  Pembayaran I
                </span>
                <span className="text-sm font-semibold">{formatIDR(effectiveDp)}</span>
                <span className="shrink-0 text-xs text-muted-foreground">DP</span>
                {dpProofUrl && (
                  <a
                    href={dpProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0"
                    aria-label="Lihat bukti pembayaran I"
                  >
                    <Image
                      src={dpProofUrl}
                      alt="Bukti pembayaran I"
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded border border-input object-cover"
                    />
                  </a>
                )}
              </div>
              {!editingDp && (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Edit pembayaran I"
                    onClick={() => {
                      setDpAmountDraft(dp ?? "");
                      setDpProofDraft(dpProofUrl);
                      setEditingDp(true);
                    }}
                    className="h-8 w-8 border border-input bg-transparent text-black transition-colors hover:bg-[#D97A7A] hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {payments.map((p, i) => (
              <div
                key={p.id}
                className="flex min-h-24 flex-col justify-between gap-2 rounded-lg border border-input bg-white/50 p-2.5"
              >
                <div className="flex min-h-9 flex-wrap items-center gap-2">
                  <span className="shrink-0 rounded border border-[#D97A7A]/40 bg-[#FED6D6]/50 px-2 py-0.5 text-xs font-semibold text-[#D97A7A]">
                    Pembayaran {roman(i + 2)}
                  </span>
                  <span className="text-sm font-semibold">{formatIDR(p.amount)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(p.paidAt).toLocaleDateString("id-ID")}
                  </span>
                  {p.note && (
                    <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                      {p.note}
                    </span>
                  )}
                  {p.proofUrl && (
                    <a
                      href={p.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                      aria-label={`Lihat bukti pembayaran ${i + 2}`}
                    >
                      <Image
                        src={p.proofUrl}
                        alt={`Bukti pembayaran ${i + 2}`}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded border border-input object-cover"
                      />
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit pembayaran ${i + 2}`}
                    onClick={() => openEditPayment(p.id)}
                    className="h-8 w-8 border border-input bg-transparent text-black transition-colors hover:bg-[#D97A7A] hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <ConfirmDeleteButton
                    size="icon"
                    title="Hapus pembayaran ini?"
                    description={`${formatIDR(p.amount)} akan dihapus dan sisa tagihan dikembalikan.`}
                    successMessage="Pembayaran berhasil dihapus"
                    onConfirm={() => deleteOrderPayment(p.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {editingDp && (
            <div className="space-y-3 rounded-lg border border-[#D97A7A]/50 bg-[#FED6D6]/20 p-3">
              <div className="space-y-1.5">
                <Label>Jumlah</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/60">
                    Rp
                  </span>
                  <Input
                    inputMode="numeric"
                    autoFocus
                    className="pl-10 placeholder:text-black/30"
                    value={dpAmountDraft ? formatRp(dpAmountDraft) : ""}
                    onChange={(e) => setDpAmountDraft(e.target.value.replace(/\D/g, ""))}
                    placeholder="Masukkan jumlah..."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Foto Bukti (opsional)</Label>
                <BookImagePicker
                  image={dpProofDraft}
                  alt="Bukti pembayaran I"
                  endpoint="paymentProof"
                  onChange={setDpProofDraft}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={pending}
                  onClick={submitDpEdit}
                  className="flex-1 border border-input bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
                >
                  <Save className="h-4 w-4" />
                  {pending ? "Menyimpan..." : "Simpan Pembayaran I"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingDp(false)}
                  className={cn("flex-1 border border-input", btn)}
                >
                  <X className="h-4 w-4" />
                  Batal
                </Button>
              </div>
            </div>
          )}

          {showPayForm ? (
            <div className="space-y-3 rounded-lg border border-[#D97A7A]/50 bg-[#FED6D6]/20 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Jumlah</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/60">
                      Rp
                    </span>
                    <Input
                      inputMode="numeric"
                      autoFocus
                      className="pl-10 placeholder:text-black/30"
                      value={payAmount ? formatRp(payAmount) : ""}
                      onChange={(e) => setPayAmount(e.target.value.replace(/\D/g, ""))}
                      placeholder="Masukkan jumlah..."
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Catatan (opsional)</Label>
                  <Input
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="Contoh: transfer BCA..."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Foto Bukti (opsional)</Label>
                <BookImagePicker
                  image={payProof}
                  alt="Bukti pembayaran"
                  endpoint="paymentProof"
                  onChange={setPayProof}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={pending}
                  onClick={submitPayment}
                  className="flex-1 border border-input bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
                >
                  <Save className="h-4 w-4" />
                  {pending ? "Menyimpan..." : "Simpan Pembayaran"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closePayForm}
                  className={cn("flex-1 border border-input", btn)}
                >
                  <X className="h-4 w-4" />
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={openAddPayment}
              className="border border-input bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
            >
              <Plus className="h-4 w-4" /> Tambah Pembayaran
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={pending}
          className="flex-1 border border-input bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
        >
          <Save className="h-4 w-4" />
          {pending ? "Menyimpan..." : initial?.id ? "Ubah Pesanan" : "Buat Pesanan"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className={cn("flex-1 border border-input", btn)}
        >
          <X className="h-4 w-4" />
          Batal
        </Button>
      </div>
        </div>

        <div className="xl:sticky xl:top-4">
          <OrderInvoicePreview
            invoiceNumber={initial?.invoiceNumber ?? null}
            date={new Date()}
            statusValue={paymentStatus}
            items={previewItems}
            subtotal={productTotal}
            shippingCost={shippingCostNum}
            dp={effectiveDp}
            dpLabel={isEdit ? "DP" : "DP (30%)"}
            total={total}
          />
        </div>
      </div>
    </form>
  );
}