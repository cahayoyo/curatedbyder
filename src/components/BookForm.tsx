"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createBook, updateBook } from "@/server/actions/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORMATS } from "@/lib/orderOptions";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

type InitialBook = {
  id?: string;
  title: string;
  publisher: string | null;
  info: string | null;
  image: string | null;
  price: number;
  stock: number;
  formats: string[];
};

type BookRow = {
  id?: string;
  title: string;
  publisher: string;
  info: string;
  image: string;
  price: string;
  stock: string;
  formats: string[];
};

const emptyRow = (): BookRow => ({
  title: "",
  publisher: "",
  info: "",
  image: "",
  price: "",
  stock: "0",
  formats: [],
});

export function BookForm({ initial }: { initial?: InitialBook }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
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
            formats: initial.formats ?? [],
          },
        ]
      : [emptyRow()]
  );

  function formatRp(digits: string): string {
    const clean = digits.replace(/\D/g, "");
    if (!clean) return "";
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function upRow(index: number, key: keyof BookRow, value: string) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, emptyRow()]);
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
        if (initial?.id) {
          const r = rows[0];
          await updateBook(initial.id, {
            title: r.title,
            publisher: r.publisher,
            info: r.info,
            image: r.image,
            price: Number(r.price),
            stock: Number(r.stock),
            formats: r.formats as ("HC" | "PB" | "BB" | "SET" | "SB")[],
          });
          toast.success("Buku diubah");
        } else {
          for (const r of rows) {
            await createBook({
              title: r.title,
              publisher: r.publisher,
              info: r.info,
              image: r.image,
              price: Number(r.price),
              stock: Number(r.stock),
              formats: r.formats as ("HC" | "PB" | "BB" | "SET" | "SB")[],
            });
          }
          toast.success(`${rows.length} buku berhasil terbuat`);
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
            <div className="flex flex-wrap items-start gap-3">
              {r.image ? (
                <div className="relative h-44 w-36 overflow-hidden rounded-lg border border-input bg-black/5">
                  <Image
                    src={r.image}
                    alt={r.title || "Book cover"}
                    fill
                    sizes="144px"
                    className="object-cover object-center"
                  />
                </div>
              ) : (
                <div className="flex h-44 w-36 items-center justify-center rounded-lg border-2 border-dashed border-[#D97A7A] bg-[#FED6D6]/30 text-sm font-medium text-[#D97A7A]">
                  <span className="flex flex-col items-center gap-1.5">
                    <ImageIcon className="h-10 w-10" />
                    No image
                  </span>
                </div>
              )}
              {r.image && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => upRow(i, "image", "")}
                  className="flex h-10 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                  Hapus Gambar
                </Button>
              )}
              <UploadButton<OurFileRouter, "bookImage">
                endpoint="bookImage"
                appearance={{
                  container: {
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  },
                  button: {
                    background: "#D97A7A",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    padding: "0 20px",
                    height: "40px",
                    borderRadius: "8px",
                    border: "1px solid #000000",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    transition: "all 150ms ease",
                  },
                  allowedContent: {
                    color: "#9ca3af",
                    fontSize: "12px",
                  },
                }}
                content={{
                  button: ({ ready, isUploading, uploadProgress }) => {
                    if (isUploading) {
                      const pct = Math.round(uploadProgress);
                      return (
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-4 w-4 rounded-full border-2 border-black/30"
                            style={{
                              background: `conic-gradient(#ffffff ${pct * 3.6}deg, transparent 0deg)`,
                              borderRadius: "50%",
                            }}
                          />
                          Mengunggah {pct}%
                        </span>
                      );
                    }
                    return ready ? (r.image ? "Ubah Gambar" : "Pilih Gambar") : "Memuat...";
                  },
                  allowedContent: "PNG / JPG / WEBP, maks 4MB",
                }}
                onClientUploadComplete={(res) => {
                  upRow(i, "image", res[0]?.url ?? "");
                  toast.success("Gambar berhasil diunggah");
                }}
                onUploadError={(err) => {
                  toast.error(err instanceof Error ? err.message : "Gagal mengunggah gambar");
                }}
              />
            </div>
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