"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBuyer, updateBuyer } from "@/server/actions/buyers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSuccessModal } from "@/components/SuccessModal";
import { Plus, Trash2, AtSign } from "lucide-react";
import { generateUsername } from "@/lib/username";

type InitialBuyer = {
  id?: string;
  name: string;
  phone: string;
  contact: string | null;
};

type BuyerRow = {
  id?: string;
  name: string;
  phone: string;
  contact: string;
};

const addBtn =
  "flex-1 border border-input bg-transparent text-black transition-colors hover:bg-[#D97A7A] hover:text-white";
const cancelBtn =
  "flex-1 border border-input bg-transparent text-black transition-colors hover:bg-white hover:text-black";

export function BuyerForm({ initial }: { initial?: InitialBuyer }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { success } = useSuccessModal();
  const [rows, setRows] = useState<BuyerRow[]>(() =>
    initial
      ? [
          {
            id: initial.id,
            name: initial.name,
            phone: initial.phone,
            contact: initial.contact ?? "",
          },
        ]
      : [{ name: "", phone: "", contact: "" }]
  );

  function upRow(index: number, key: string, value: string) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, { name: "", phone: "", contact: "" }]);
  }

  function removeRow(index: number) {
    setRows((rs) => rs.filter((_, i) => i !== index));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (initial?.id) {
          const r = rows[0];
          const res = await updateBuyer(initial.id, {
            name: r.name,
            phone: r.phone,
            contact: r.contact || null,
          });
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          success(`${r.name.trim()} berhasil diubah!`);
        } else {
          for (const r of rows) {
            const res = await createBuyer({
              name: r.name,
              phone: r.phone,
              contact: r.contact || null,
            });
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
          }
          success("Pembeli berhasil dibuat!");
        }
        router.push("/admin/buyers");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan pembeli");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-lg border p-4">
      {rows.map((r, i) => (
        <div key={r.id ?? i} className="space-y-3 border border-input rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              {rows.length === 1 ? "Pembeli" : `Pembeli ${i + 1}`}
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
              <Label>Nama</Label>
              <Input
                value={r.name}
                onChange={(e) => upRow(i, "name", e.target.value)}
                required
                placeholder="Masukan nama..."
                className="placeholder:text-[#b5b5b5]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nomor Telepon</Label>
              <Input
                value={r.phone}
                inputMode="numeric"
                onChange={(e) => upRow(i, "phone", e.target.value.replace(/\D/g, ""))}
                required
                placeholder="Masukkan nomor telepon..."
                className="placeholder:text-[#b5b5b5]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Alamat</Label>
              <Input
                value={r.contact}
                onChange={(e) => upRow(i, "contact", e.target.value)}
                placeholder="Opsional..."
                className="placeholder:text-[#b5b5b5]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-black/5 px-3 py-2">
            <AtSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Username:</span>
            <span className="font-mono font-semibold">
              {r.name.trim() && r.phone ? generateUsername(r.name, r.phone) : "—"}
            </span>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {!initial?.id && (
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            className={addBtn}
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
          {pending ? "Menyimpan..." : initial?.id ? "Simpan" : "Buat Pembeli"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className={cancelBtn}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}