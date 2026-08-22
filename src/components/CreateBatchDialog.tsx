"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBatch } from "@/server/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Layers2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function CreateBatchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<string[]>([""]);
  const [pending, startTransition] = useTransition();

  function addField() {
    setFields((f) => [...f, ""]);
  }

  function updateField(idx: number, value: string) {
    setFields((f) => f.map((v, i) => (i === idx ? value : v)));
  }

  function removeField(idx: number) {
    setFields((f) => f.filter((_, i) => i !== idx));
  }

  function handleCreate() {
    const names = fields.map((f) => f.trim()).filter(Boolean);
    if (names.length === 0) return toast.error("Masukkan minimal satu nama batch");

    startTransition(async () => {
      try {
        let created = 0;
        for (const n of names) {
          const res = await createBatch(n);
          if (res.ok) created++;
        }
        if (created > 0) {
          toast.success(`${created} batch berhasil dibuat`);
          setOpen(false);
          setFields([""]);
          router.refresh();
        } else {
          toast.error("Tidak ada batch baru yang dibuat (mungkin sudah ada)");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal membuat batch");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="default"
          className="h-9 w-full border border-input bg-black px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#D97A7A] hover:text-white sm:w-40"
        >
          <Layers2 className="h-4 w-4" />
          Tambah Batch
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[90%] max-w-md"
        style={{ backgroundColor: "#FED6D6" }}
      >
        <DialogHeader>
          <DialogTitle>Buat Batch Baru</DialogTitle>
          <DialogDescription className="text-black/80">
            Masukkan nama batch (satu per baris), lalu tekan Buat Batch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {fields.map((val, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>Nama Batch {fields.length > 1 ? i + 1 : ""}</Label>
                <Input
                  value={val}
                  onChange={(e) => updateField(i, e.target.value)}
                  placeholder="Contoh: BATCH3"
                  className="bg-white placeholder:text-black/30"
                />
              </div>
              {i > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeField(i)}
                  className="mb-0.5 border border-transparent bg-transparent text-destructive transition-colors hover:bg-red-500 hover:text-white"
                  aria-label={`Hapus batch ${i + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addField}
          className="border border-input bg-transparent text-black transition-colors hover:bg-[#D97A7A] hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Tambah
        </Button>

        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setFields([""]);
            }}
            className="flex-1 border border-input bg-transparent"
          >
            Batal
          </Button>
          <Button
            onClick={handleCreate}
            disabled={pending}
            className="flex-1 border border-input bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
          >
            {pending ? "Membuat..." : "Buat Batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}