"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { useSuccessModal } from "@/components/SuccessModal";
import { Plus, Trash2 } from "lucide-react";
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

export function BookForm({
  initial,
  batches = [],
}: {
  initial?: InitialBook;
  batches?: Batch[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { success } = useSuccessModal();
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

  const footerBtn =
    "border border-input bg-transparent text-black transition transition-colors hover:bg-white hover:text-black";

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
            toast.error(res.error);
            return;
          }
          await setBookBatchPrices({ bookId: initial.id, entries: entriesFor(r) });
          success(`${r.title.trim()} berhasil diubah!`);
        } else {
          for (const r of rows) {
            const res = await createBook(bookPayload(r));
            if (!res.ok) {
              toast.error(res.error);
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
        }
        router.push("/admin/books");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save book");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-lg border p-4">
      {rows.map((r, i) => (
        <div key={r.id ?? i} className="space-y-3 border border-input rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              {rows.length === 1 ? "Buku" : `Buku ${i + 1}`}
            </span>
            {i > 0 && (
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
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Judul</Label>
            <Input
              value={r.title}
              onChange={(e) => upRow(i, "title", e.target.value)}
              required
              placeholder="Masukkan judul buku..."
              className="placeholder:text-[#b5b5b5]"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Gambar</Label>
            <BookImagePicker
              image={r.image}
              alt={r.title || "Book cover"}
              onChange={(url) => upRow(i, "image", url)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="flex flex-wrap gap-3 pt-2">
                {FORMATS.map((f) => (
                  <label
                    key={f.value}
                    className="flex cursor-pointer items-center gap-1.5 text-sm"
                  >
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

          <div className="space-y-1.5">
            <Label>Informasi</Label>
            <Textarea
              value={r.info}
              onChange={(e) => upRow(i, "info", e.target.value)}
              placeholder="Masukkan informasi buku (opsional)..."
              rows={3}
              className="placeholder:text-[#b5b5b5]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Harga</Label>
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
              <Label>Stok</Label>
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

          <div className="space-y-1.5">
            <Label>Status Stok</Label>
            <div className="flex flex-wrap gap-4 pt-1">
              {BOOK_STATUSES.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-1.5 text-sm"
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
              <Label>
                Harga per Batch{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (opsional — dipakai di pesanan sesuai batch, jika kosong pakai Harga di atas)
                </span>
              </Label>
              <Button
                type="button"
                onClick={() => addBatchPriceRow(i)}
                className="flex h-10 items-center gap-1.5 rounded-lg border border-[#D97A7A] bg-[#FED6D6] px-4 text-sm font-semibold text-[#D97A7A] transition-colors hover:bg-[#D97A7A] hover:text-white"
              >
                <Plus className="h-4 w-4" /> Tambah Harga Batch
              </Button>
              {r.batchPrices.map((br, bi) => (
                <div key={bi} className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="space-y-1 flex-[1.4] min-w-0">
                    <Select
                      value={br.batchId}
                      onValueChange={(v) =>
                        upBatchPrice(i, bi, { batchId: v })
                      }
                    >
                      <SelectTrigger className="w-full">
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
                  <div className="relative flex-[1] min-w-[160px]">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/60">
                      Rp
                    </span>
                    <Input
                      inputMode="numeric"
                      className="pl-10"
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
                    className="border border-input text-destructive transition-colors hover:bg-red-500 hover:text-white"
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
              {r.batchPrices.length > 0 && (
                <Button
                  type="button"
                  size="icon"
                  onClick={() => addBatchPriceRow(i)}
                  aria-label="Tambah harga batch"
                  className="h-10 w-10 rounded-lg border border-[#D97A7A] bg-[#FED6D6] text-[#D97A7A] transition-colors hover:bg-[#D97A7A] hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {!initial?.id && (
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            className="flex-1 border border-input bg-transparent text-black transition-colors hover:bg-[#D97A7A] hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        )}
        <Button
          type="submit"
          disabled={pending}
          className="flex-1 border border-input bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
        >
          {pending ? "Talepan..." : initial?.id ? "Ubah Buku" : "Buat Buku"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className={cn("flex-1 border border-input", footerBtn)}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}