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
  const [name, setName] = useState("");
  const [pendingList, setPendingList] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function addToPending() {
    const n = name.trim();
    if (!n) return;
    if (pendingList.some((p) => p === n)) {
      toast.error("Nama sudah ada di daftar");
      return;
    }
    setPendingList((l) => [...l, n]);
    setName("");
  }

  function removePending(idx: number) {
    setPendingList((l) => l.filter((_, i) => i !== idx));
  }

  function handleCreate() {
    if (pendingList.length === 0) return toast.error("Tambahkan minimal satu nama batch");

    startTransition(async () => {
      try {
        let created = 0;
        for (const n of pendingList) {
          const res = await createBatch(n);
          if (res.ok) created++;
        }
        if (created > 0) {
          toast.success(`${created} batch berhasil dibuat`);
          setOpen(false);
          setPendingList([]);
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
          variant="outline"
          className="border border-input bg-transparent text-black shadow-sm transition-colors hover:bg-[#D97A7A] hover:text-white"
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
            Masukkan nama batch lalu tekan Tambah untuk menambahkan ke daftar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="flex-1 space-y-1.5">
            <Label>Nama Batch</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addToPending();
                }
              }}
              placeholder="Contoh: BATCH3"
              className="bg-white placeholder:text-black/30"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addToPending}
            className="mt-6 border border-input bg-transparent text-black transition-colors hover:bg-[#D97A7A] hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>

        {pendingList.length > 0 && (
          <ul className="space-y-1">
            {pendingList.map((n, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md border border-input bg-white/70 px-3 py-1.5 text-sm"
              >
                <span className="font-mono font-medium">{n}</span>
                <button
                  type="button"
                  onClick={() => removePending(i)}
                  className="text-destructive transition-colors hover:text-red-700"
                  aria-label={`Hapus ${n}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setPendingList([]);
              setName("");
            }}
            className="flex-1 border border-input bg-transparent"
          >
            Cancel
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