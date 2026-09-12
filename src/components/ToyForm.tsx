"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { capture } from "@/lib/posthog";
import { createToy, updateToy, setToyBatchPrices } from "@/server/actions/toys";
import { MAX_NAME } from "@/lib/limits";
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
  Check,
  Eye,
  ImageIcon,
  Lightbulb,
  Package,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { BOOK_STATUSES } from "@/lib/orderOptions";
import { formatRp } from "@/lib/format";
import { BookImagePicker } from "@/components/BookImagePicker";

type InitialToy = {
  id?: string;
  title: string;
  info: string | null;
  image: string | null;
  price: number;
  stock: number;
  status: "READY_STOCK" | "PRE_ORDER";
  batchPrices?: { batchId: string; price: number }[];
};

type Batch = { id: string; name: string };

type ToyRow = {
  id?: string;
  title: string;
  info: string;
  image: string;
  price: string;
  stock: string;
  status: "READY_STOCK" | "PRE_ORDER";
  batchPrices: { batchId: string; price: string }[];
};

const emptyRow = (): ToyRow => ({
  title: "",
  info: "",
  image: "",
  price: "",
  stock: "0",
  status: "READY_STOCK",
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
        <h3 className="text-[17px] font-semibold leading-tight">{title}</h3>
        <p className="text-[15px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function ToyForm({
  initial,
  batches = [],
}: {
  initial?: InitialToy;
  batches?: Batch[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { success, error } = useSuccessModal();
  const [rows, setRows] = useState<ToyRow[]>(() =>
    initial
      ? [
          {
            id: initial.id,
            title: initial.title,
            info: initial.info ?? "",
            image: initial.image ?? "",
            price: initial.price != null ? String(initial.price) : "",
            stock: initial.stock != null ? String(initial.stock) : "0",
            status: initial.status ?? "READY_STOCK",
            batchPrices: (initial.batchPrices ?? []).map((b) => ({
              batchId: b.batchId,
              price: String(b.price),
            })),
          },
        ]
      : [emptyRow()]
  );

  function upRow(index: number, key: keyof ToyRow, value: string) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, emptyRow()]);
  }

  function upBatchPrice(index: number, bi: number, patch: { batchId?: string; price?: string }) {
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
        i === index ? { ...r, batchPrices: [...r.batchPrices, { batchId: "", price: "" }] } : r
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

  function removeRow(index: number) {
    setRows((rs) => rs.filter((_, i) => i !== index));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const toyPayload = (r: ToyRow) => ({
          title: r.title,
          info: r.info,
          image: r.image,
          price: Number(r.price),
          stock: Number(r.stock),
          status: r.status,
        });
        const entriesFor = (r: ToyRow) =>
          r.batchPrices
            .filter((b) => b.batchId && b.price !== "")
            .map((b) => ({
              batchId: b.batchId,
              price: Number(b.price),
            }));

        if (initial?.id) {
          const r = rows[0];
          const res = await updateToy(initial.id, toyPayload(r));
          if (!res.ok) {
            error(res.error);
            return;
          }
          await setToyBatchPrices({ toyId: initial.id, entries: entriesFor(r) });
          success(`${r.title.trim()} berhasil diubah!`);
          capture("toy_updated", { batch_price_count: entriesFor(r).length });
        } else {
          for (const r of rows) {
            const res = await createToy(toyPayload(r));
            if (!res.ok) {
              error(res.error);
              return;
            }
            const entries = entriesFor(r);
            if (entries.length > 0) {
              await setToyBatchPrices({ toyId: res.data.id, entries });
            }
          }
          success(
            rows.length === 1
              ? `${rows[0].title.trim()} berhasil dibuat!`
              : `${rows.length} mainan berhasil dibuat!`,
          );
          capture("toy_created", { toy_count: rows.length });
        }
        router.push("/admin/toys");
        router.refresh();
      } catch (err) {
        error(err instanceof Error ? err.message : "Failed to save mainan");
      }
    });
  }

  const cardCls = "rounded-xl border bg-white p-4 shadow-sm";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 [&_input]:text-base [&_label]:text-base [&_textarea]:text-base"
    >
      {rows.map((r, i) => (
        <div key={r.id ?? i} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main column */}
          <div className="space-y-4">
            {rows.length > 1 && (
              <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-2 shadow-sm">
                <span className="text-base font-semibold">Mainan {i + 1}</span>
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

            <section className={cardCls}>
              <SectionHeader
                icon={Package}
                title="Informasi Utama"
                subtitle="Lengkapi informasi dasar mainan yang akan ditambahkan."
              />

              <div className="space-y-1.5">
                <Label>
                  Judul Mainan <RequiredMark />
                </Label>
                <Input
                  value={r.title}
                  onChange={(e) => upRow(i, "title", e.target.value)}
                  required
                  maxLength={MAX_NAME}
                  placeholder="Masukkan judul mainan..."
                  className="placeholder:text-[#b5b5b5]"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Gambar Mainan</Label>
                  <BookImagePicker
                    variant="dropzone"
                    image={r.image}
                    alt={r.title || "Toy image"}
                    onChange={(url) => upRow(i, "image", url)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Status Stok <RequiredMark />
                  </Label>
                  <div className="flex flex-wrap gap-5 pt-1.5">
                    {BOOK_STATUSES.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer items-center gap-2"
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
              </div>

              <div className="mt-4 space-y-1.5">
                <Label>Informasi (opsional)</Label>
                <Textarea
                  value={r.info}
                  onChange={(e) => upRow(i, "info", e.target.value)}
                  placeholder="Masukkan informasi mainan (opsional)..."
                  rows={3}
                  maxLength={500}
                  className="placeholder:text-[#b5b5b5]"
                />
                <p className="text-right text-[13px] text-muted-foreground">
                  {r.info.length}/500
                </p>
              </div>

              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>
                    Harga <RequiredMark />
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-black/60">
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

              {batches.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>Harga per Batch (opsional)</Label>
                  {r.batchPrices.map((br, bi) => (
                    <div key={bi} className="space-y-2 rounded-lg border bg-[#FDF8F4] p-2.5">
                      <div className="flex items-end gap-2">
                        <div className="min-w-0 flex-[1.4] space-y-1">
                          <Select
                            value={br.batchId}
                            onValueChange={(v) => upBatchPrice(i, bi, { batchId: v })}
                          >
                            <SelectTrigger className="w-full bg-white text-base">
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
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-black/60">
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
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() => addBatchPriceRow(i)}
                    className="flex h-10 items-center gap-1.5 rounded-lg border border-[#D97A7A] bg-[#FED6D6] px-4 text-sm font-semibold text-[#D97A7A] transition-colors hover:bg-[#D97A7A] hover:text-white"
                  >
                    <Plus className="h-4 w-4" /> Tambah Harga Batch
                  </Button>
                  <p className="text-[15px] text-muted-foreground">
                    Disimpan otomatis saat mainan disimpan. Jika kosong, harga di atas dipakai
                    untuk semua batch.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Side column */}
          <aside className="space-y-4">
            <section className={cardCls}>
              <h3 className="mb-3 flex items-center gap-2 text-[17px] font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FDE7E7] text-[#C96A6A]">
                  <Eye className="h-3.5 w-3.5" />
                </span>
                Preview Mainan
              </h3>
              {r.image ? (
                <div className="relative mx-auto h-64 w-full max-w-[220px] overflow-hidden rounded-lg border bg-black/5">
                  <Image
                    src={r.image}
                    alt={r.title || "Preview mainan"}
                    fill
                    sizes="220px"
                    className="object-cover object-center"
                  />
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#E3B4B4] bg-[#FDF1F1] px-4 text-center">
                  <ImageIcon className="h-8 w-8 text-[#D97A7A]/70" />
                  <p className="text-base font-medium text-[#C96A6A]">Belum ada gambar</p>
                  <p className="text-[15px] text-muted-foreground">
                    Upload gambar untuk melihat preview
                  </p>
                </div>
              )}
              {r.title.trim() && (
                <p className="mt-3 truncate text-center text-base font-semibold">{r.title}</p>
              )}
            </section>

            <section className={cardCls}>
              <h3 className="mb-2 flex items-center gap-2 text-[17px] font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FDE7E7] text-[#C96A6A]">
                  <Lightbulb className="h-3.5 w-3.5" />
                </span>
                Tips
              </h3>
              <ol className="list-decimal space-y-1.5 pl-5 text-[15px] text-muted-foreground">
                <li>Gunakan gambar dengan resolusi tinggi dan jelas.</li>
                <li>Isi informasi mainan dengan lengkap.</li>
                <li>Pastikan harga dan stok sudah sesuai.</li>
                <li>Harga per batch opsional — kosongkan jika harga sama untuk semua batch.</li>
              </ol>
            </section>
          </aside>
        </div>
      ))}

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-white/95 p-3 shadow-sm backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1 border border-[#F0CBCB] bg-white text-[15px] text-black transition-colors hover:bg-[#FDF1F1]"
        >
          <X className="h-4 w-4" />
          Batal
        </Button>
        {!initial?.id && (
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            className="flex-1 border border-transparent bg-[#FBE3E3] text-[15px] text-[#C96A6A] transition-colors hover:bg-[#F6D5D5] hover:text-[#C96A6A]"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        )}
        <Button
          type="submit"
          disabled={pending}
          className="flex-1 bg-[#D97A7A] text-[15px] text-white transition-colors hover:bg-[#c96666]"
        >
          <Check className="h-4 w-4" />
          {pending ? "Menyimpan..." : initial?.id ? "Ubah Mainan" : "Buat Mainan"}
        </Button>
      </div>
    </form>
  );
}
