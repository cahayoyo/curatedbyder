"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBook, updateBook } from "@/server/actions/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORMATS } from "@/lib/orderOptions";

type InitialBook = {
  id?: string;
  title: string;
  price: number;
  stock: number;
  formats: string[];
};

type BookRow = {
  id?: string;
  title: string;
  price: string;
  stock: string;
  formats: string[];
};

export function BookForm({ initial }: { initial?: InitialBook }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState<BookRow[]>(() =>
    initial
      ? [
          {
            id: initial.id,
            title: initial.title,
            price: initial.price != null ? String(initial.price) : "",
            stock: initial.stock != null ? String(initial.stock) : "0",
            formats: initial.formats ?? [],
          },
        ]
      : [{ title: "", price: "", stock: "0", formats: [] }]
  );

  function formatRp(digits: string): string {
    const clean = digits.replace(/\D/g, "");
    if (!clean) return "";
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function upRow(index: number, key: string, value: string) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, { title: "", price: "", stock: "0", formats: [] }]);
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
    "border border-input bg-transparent text-black transition transition-colors hover:bg-[#FED6D6] hover:text-black";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (initial?.id) {
          const r = rows[0];
          await updateBook(initial.id, {
            title: r.title,
            price: Number(r.price),
            stock: Number(r.stock),
            formats: r.formats as ("HC" | "PB" | "BB" | "BS" | "SB")[],
          });
          toast.success("Buku diubah");
        } else {
          for (const r of rows) {
            await createBook({
              title: r.title,
              price: Number(r.price),
              stock: Number(r.stock),
              formats: r.formats as ("HC" | "PB" | "BB" | "BS" | "SB")[],
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
          <div className="grid gap-4 sm:grid-cols-3">
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
            <Label>Format</Label>
            <div className="flex flex-wrap gap-3">
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
      ))}
      <div className="flex flex-wrap gap-2">
        {!initial?.id && (
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            className={cn("flex-1 border border-input", footerBtn)}
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        )}
        <Button
          type="submit"
          disabled={pending}
          className={cn("flex-1 border border-input", footerBtn)}
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