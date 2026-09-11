"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { capture } from "@/lib/posthog";
import { createBook, updateBook, setBookBatchPrices } from "@/server/actions/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSuccessModal } from "@/components/SuccessModal";
import {
  Boxes,
  BookOpen,
  Check,
  Eye,
  FileText,
  ImageIcon,
  Lightbulb,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FORMATS, BOOK_STATUSES } from "@/lib/orderOptions";
import { formatRp } from "@/lib/format";
import { BookImagePicker } from "@/components/BookImagePicker";

type InitialBook = {
  id?: string;
  title: string;
  publisher: string | null;
  info: string | null;
  image: string | null;
  price: number;
  stock: number;
  status: "READY_STOCK" | "PRE_ORDER";
  formats: string[];
  batchPrices?: { batchId: string; price: number; formats: string[] }[];
};

type Batch = { id: string; name: string };

type BookRow = {
  id?: string;
  title: string;
  publisher: string;
  info: string;
  image: string;
  price: string;
  stock: string;
  status: "READY_STOCK" | "PRE_ORDER";
  formats: string[];
  batchPrices: { batchId: string; price: string; formats: string[] }[];
};

const emptyRow = (): BookRow => ({
  title: "",
  publisher: "",
  info: "",
  image: "",
  price: "",
  stock: "0",
  status: "READY_STOCK",
  formats: [],
  batchPrices: [],
});

function RequiredMark() {
  return <span className="text-[#D97A7A]">*</span>;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FDE7E7] text-[#C96A6A]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="font-semibold leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function BookForm({
  initial,
  batches = [],
}: {
  initial?: InitialBook;
  batches?: Batch[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { success, error } = useSuccessModal();
  const [rows, setRows] = useState<BookRow[]>(() =>
    initial
      ? [
          {
            id: initial.id,
            title: initial.title,
            publisher: initial.publisher ?? "",
            info: initial.info ?? "",
            image: initial.image ?? "",
            price: initial.price != null ? String(initial.price) : "",
            stock: initial.stock != null ? String(initial.stock) : "0",
            status: initial.status ?? "READY_STOCK",
            formats: initial.formats ?? [],
            batchPrices: (initial.batchPrices ?? []).map((b) => ({
              batchId: b.batchId,
              price: String(b.price),
              formats: b.formats ?? [],
            })),
          },
        ]
      : [emptyRow()]
  );

  function upRow(index: number, key: keyof BookRow, value: string) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, emptyRow()]);
  }

  function upBatchPrice(index: number, bi: number, patch: { batchId?: string; price?: string; formats?: string[] }) {
    setRows((rs) =>
      rs.map((r, i) =>
        i === index
          ? {
              ...r,
              batchPrices: r.batchPrices.map((bp, n) =>
                n === bi ? { ...bp, ...patch } : bp
              ),
            }
          : r
      )
    );
  }

  function addBatchPriceRow(index: number) {
    setRows((rs) =>
      rs.map((r, i) =>
        i === index ? { ...r, batchPrices: [...r.batchPrices, { batchId: "", price: "", formats: [] }] } : r
      )
    );
  }

  function toggleBatchFormat(index: number, bi: number, value: string) {
    setRows((rs) =>
      rs.map((r, i) =>
        i === index
          ? {
              ...r,
              batchPrices: r.batchPrices.map((bp, n) =>
                n === bi
                  ? {
                      ...bp,
                      formats: bp.formats.includes(value)
                        ? bp.formats.filter((f) => f !== value)
                        : [...bp.formats, value],
                    }
                  : bp
              ),
            }
          : r
      )
    );
  }

  function removeBatchPriceRow(index: number, bi: number) {
    setRows((rs) =>
      rs.map((r, i) =>
        i === index ? { ...r, batchPrices: r.batchPrices.filter((_, n) => n !== bi) } : r
      )
    );
  }

  function toggleFormat(index: number, value: string) {
    setRows((rs) =>
      rs.map((r, i) =>
        i === index
          ? {
              ...r,
              formats: r.formats.includes(value)
                ? r.formats.filter((f) => f !== value)
                : [...r.formats, value],
            }
          : r
      )
    );
  }

  function removeRow(index: number) {
    setRows((rs) => rs.filter((_, i) => i !== index));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const bookPayload = (r: BookRow) => ({
          title: r.title,
          publisher: r.publisher,
          info: r.info,
          image: r.image,
          price: Number(r.price),
          stock: Number(r.stock),
          status: r.status,
          formats: r.formats as ("HC" | "PB" | "BB" | "SET" | "SB")[],
        });
        const entriesFor = (r: BookRow) =>
          r.batchPrices
            .filter((b) => b.batchId && b.price !== "")
            .map((b) => ({
              batchId: b.batchId,
              price: Number(b.price),
              formats: b.formats as ("HC" | "PB" | "BB" | "SET" | "SB")[],
            }));

        if (initial?.id) {
          const r = rows[0];
          const res = await updateBook(initial.id, bookPayload(r));
          if (!res.ok) {
            error(res.error);
            return;
          }
          await setBookBatchPrices({ bookId: initial.id, entries: entriesFor(r) });
          success(`${r.title.trim()} berhasil diubah!`);
          capture("book_updated", { batch_price_count: entriesFor(r).length });
        } else {
          for (const r of rows) {
            const res = await createBook(bookPayload(r));
            if (!res.ok) {
              error(res.error);
              return;
            }
            const entries = entriesFor(r);
            if (entries.length > 0) {
              await setBookBatchPrices({ bookId: res.data.id, entries });
            }
          }
          success(
            rows.length === 1
              ? `${rows[0].title.trim()} berhasil dibuat!`
              : `${rows.length} buku berhasil dibuat!`,
          );
          capture("book_created", { book_count: rows.length });
        }
        router.push("/admin/books");
        router.refresh();
      } catch (err) {
        error(err instanceof Error ? err.message : "Failed to save book");
      }
    });
  }

  const cardCls = "rounded-xl border bg-white p-4 shadow-sm";
  const pillCls = (active: boolean) =>
    cn(
      "flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
      active ? "border-[#D97A7A] bg-[#FED6D6]/60 text-black" : "bg-white hover:bg-[#FDF1F1]"
    );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {rows.map((r, i) => (
        <div key={r.id ?? i} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main column */}
          <div className="space-y-4">
            {rows.length > 1 && (
              <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-2 shadow-sm">
                <span className="text-sm font-semibold">Buku {i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(i)}
                  className="border border-input text-destructive transition-colors hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            )}

            {/* Informasi Utama */}
            <section className={cardCls}>
              <SectionHeader
                icon={BookOpen}
                title="Informasi Utama"
                subtitle="Lengkapi informasi dasar buku yang akan ditambahkan."
              />

              <div className="space-y-1.5">
                <Label>
                  Judul Buku <RequiredMark />
                </Label>
                <Input
                  value={r.title}
                  onChange={(e) => upRow(i, "title", e.target.value)}
                  required
                  placeholder="Masukkan judul buku..."
                  className="placeholder:text-[#b5b5b5]"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Gambar Sampul</Label>
                  <BookImagePicker
                    variant="dropzone"
                    image={r.image}
                    alt={r.title || "Book cover"}
                    onChange={(url) => upRow(i, "image", url)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Publisher</Label>
                    <Input
                      value={r.publisher}
                      onChange={(e) => upRow(i, "publisher", e.target.value)}
                      placeholder="Masukkan publisher..."
                      className="placeholder:text-[#b5b5b5]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Format</Label>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {FORMATS.map((f) => (
                        <label key={f.value} className={pillCls(r.formats.includes(f.value))}>
                          <input
                            type="checkbox"
                            checked={r.formats.includes(f.value)}
                            onChange={() => toggleFormat(i, f.value)}
                            className="h-4 w-4 accent-[#D97A7A]"
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Detail Buku */}
            <section className={cardCls}>
              <SectionHeader
                icon={FileText}
                title="Detail Buku"
                subtitle="Lengkapi informasi tambahan untuk memudahkan pencarian."
              />

              <div className="space-y-1.5">
                <Label>Informasi Buku (opsional)</Label>
                <Textarea
                  value={r.info}
                  onChange={(e) => upRow(i, "info", e.target.value)}
                  placeholder="Masukkan sinopsis, ringkasan, atau informasi tambahan..."
                  rows={3}
                  maxLength={500}
                  className="placeholder:text-[#b5b5b5]"
                />
                <p className="text-right text-[11px] text-muted-foreground">
                  {r.info.length}/500
                </p>
              </div>

              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>
                    Harga <RequiredMark />
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/60">
                      Rp
                    </span>
                    <Input
                      inputMode="numeric"
                      className="pl-10"
                      value={r.price ? formatRp(r.price) : ""}
                      onChange={(e) => upRow(i, "price", e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Stok <RequiredMark />
                  </Label>
                  <Input
                    inputMode="numeric"
                    value={r.stock}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      upRow(i, "stock", digits.replace(/^0+(?=\d)/, ""));
                    }}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Status & Batch */}
            <section className={cardCls}>
              <SectionHeader
                icon={Boxes}
                title="Status & Batch"
                subtitle="Atur status stok dan harga per batch (jika diperlukan)."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>
                    Status Stok <RequiredMark />
                  </Label>
                  <div className="flex flex-wrap gap-5 pt-1.5">
                    {BOOK_STATUSES.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="radio"
                          name={`status-${i}`}
                          value={opt.value}
                          checked={r.status === opt.value}
                          onChange={() => upRow(i, "status", opt.value)}
                          className="h-4 w-4 accent-[#D97A7A]"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                {batches.length > 0 && (
                  <div className="space-y-2">
                    <Label>Harga per Batch (opsional)</Label>
                    {r.batchPrices.map((br, bi) => (
                      <div key={bi} className="space-y-2 rounded-lg border bg-[#FDF8F4] p-2.5">
                        <div className="flex items-end gap-2">
                          <div className="min-w-0 flex-[1.4] space-y-1">
                            <Select
                              value={br.batchId}
                              onValueChange={(v) => upBatchPrice(i, bi, { batchId: v })}
                            >
                              <SelectTrigger className="w-full bg-white">
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
                          <div className="relative min-w-[140px] flex-[1]">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/60">
                              Rp
                            </span>
                            <Input
                              inputMode="numeric"
                              className="bg-white pl-10"
                              value={br.price ? formatRp(br.price) : ""}
                              onChange={(e) =>
                                upBatchPrice(i, bi, { price: e.target.value.replace(/\D/g, "") })
                              }
                              placeholder="Harga"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBatchPriceRow(i, bi)}
                            className="shrink-0 border border-input bg-white text-destructive transition-colors hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 pl-1">
                          <span className="text-xs text-muted-foreground">Format:</span>
                          {FORMATS.map((f) => (
                            <label
                              key={f.value}
                              className="flex cursor-pointer items-center gap-1.5 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={br.formats.includes(f.value)}
                                onChange={() => toggleBatchFormat(i, bi, f.value)}
                                className="h-4 w-4 accent-[#D97A7A]"
                              />
                              {f.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={() => addBatchPriceRow(i)}
                      className="flex h-10 items-center gap-1.5 rounded-lg border border-[#D97A7A] bg-[#FED6D6] px-4 text-sm font-semibold text-[#D97A7A] transition-colors hover:bg-[#D97A7A] hover:text-white"
                    >
                      <Plus className="h-4 w-4" /> Tambah Harga Batch
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Disimpan otomatis saat buku disimpan. Klik &lsquo;Tambah Harga Batch&rsquo;
                      untuk menambahkan harga batch baru.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Side column */}
          <aside className="space-y-4">
            <section className={cardCls}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FDE7E7] text-[#C96A6A]">
                  <Eye className="h-3.5 w-3.5" />
                </span>
                Preview Sampul
              </h3>
              {r.image ? (
                <div className="relative mx-auto h-64 w-full max-w-[220px] overflow-hidden rounded-lg border bg-black/5">
                  <Image
                    src={r.image}
                    alt={r.title || "Preview sampul"}
                    fill
                    sizes="220px"
                    className="object-cover object-center"
                  />
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#E3B4B4] bg-[#FDF1F1] px-4 text-center">
                  <ImageIcon className="h-8 w-8 text-[#D97A7A]/70" />
                  <p className="text-sm font-medium text-[#C96A6A]">Belum ada gambar</p>
                  <p className="text-xs text-muted-foreground">
                    Upload gambar untuk melihat preview
                  </p>
                </div>
              )}
            </section>

            <section className={cardCls}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FDE7E7] text-[#C96A6A]">
                  <Lightbulb className="h-3.5 w-3.5" />
                </span>
                Tips
              </h3>
              <ul className="list-disc space-y-1.5 pl-5 text-xs text-muted-foreground">
                <li>Gunakan gambar dengan resolusi tinggi dan jelas.</li>
                <li>Isi informasi buku dengan lengkap.</li>
                <li>Pastikan harga dan stok sudah sesuai.</li>
                <li>
                  Pilih format buku yang tepat:
                  <ul className="mt-1 list-[circle] space-y-1 pl-4">
                    <li>HC : Hard Cover</li>
                    <li>PB : Paperback</li>
                    <li>BB : Big Book</li>
                    <li>SET : Set</li>
                    <li>SB : Soft Book</li>
                  </ul>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      ))}

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-white/95 p-3 shadow-sm backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1 border border-input bg-transparent text-black transition-colors hover:bg-white"
        >
          <X className="h-4 w-4" />
          Batal
        </Button>
        {!initial?.id && (
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            className="flex-1 border border-input bg-transparent text-black transition-colors hover:bg-[#FED6D6]/50"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        )}
        <Button
          type="submit"
          disabled={pending}
          className="flex-1 bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
        >
          <Check className="h-4 w-4" />
          {pending ? "Menyimpan..." : initial?.id ? "Ubah Buku" : "Buat Buku"}
        </Button>
      </div>
    </form>
  );
}
