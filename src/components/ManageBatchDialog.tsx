"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBatch, updateBatch, deleteBatch } from "@/server/actions/orders";
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
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { Layers2, Plus, Pencil, Trash2, X } from "lucide-react";
import { useSuccessModal } from "@/components/SuccessModal";

type Batch = { id: string; name: string };

export function ManageBatchDialog({ batches }: { batches: Batch[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<string[]>([""]);
  const [pending, startTransition] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { success, error } = useSuccessModal();

  function addField() {
    setFields((f) => [...f, ""]);
  }

  function updateField(idx: number, value: string) {
    setFields((f) => f.map((v, i) => (i === idx ? value : v)));
  }

  function removeField(idx: number) {
    setFields((f) => f.filter((_, i) => i !== idx));
  }

  function startEdit(b: Batch) {
    setEditingId(b.id);
    setEditValue(b.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  function handleCreate() {
    const names = fields.map((f) => f.trim()).filter(Boolean);
    if (names.length === 0) return error("Masukkan minimal satu nama batch");

    startTransition(async () => {
      try {
        let created = 0;
        let firstError: string | null = null;
        for (const n of names) {
          const res = await createBatch(n);
          if (res.ok) created++;
          else firstError ??= res.error;
        }
        if (created > 0) {
          success(`${created} batch berhasil dibuat`);
          setFields([""]);
          router.refresh();
        } else {
          error(firstError ?? "Tidak ada batch baru yang dibuat (mungkin sudah ada)");
        }
      } catch (e) {
        error(e instanceof Error ? e.message : "Gagal membuat batch");
      }
    });
  }

  function handleSaveEdit() {
    if (!editingId) return;
    const name = editValue.trim();
    if (!name) return error("Nama batch tidak boleh kosong");

    startTransition(async () => {
      try {
        const res = await updateBatch(editingId, name);
        if (!res.ok) {
          error(res.error);
          return;
        }
        success("Batch diubah");
        cancelEdit();
        router.refresh();
      } catch (e) {
        error(e instanceof Error ? e.message : "Gagal mengubah batch");
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
          Kelola Batch
        </Button>
      </DialogTrigger>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="max-h-[80vh] w-[92%] max-w-md overflow-y-auto"
        style={{ backgroundColor: "#F6F1E7" }}
      >
        <DialogHeader>
          <DialogTitle>Kelola Batch</DialogTitle>
          <DialogDescription className="text-black/80">
            Buat batch baru atau kelola batch yang sudah ada.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm font-semibold">Buat Batch Baru</p>
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
                  aria-label={`Hapus baris batch ${i + 1}`}
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

        <div className="my-1 h-px w-full bg-black/15" />

        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setFields([""]);
              cancelEdit();
            }}
            className="flex-1 border border-input bg-transparent"
          >
            Tutup
          </Button>
          <Button
            onClick={handleCreate}
            disabled={pending}
            className="flex-1 border border-input bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
          >
            {pending ? "Membuat..." : "Buat Batch"}
          </Button>
        </DialogFooter>

        <div className="my-1 h-px w-full bg-black/15" />

        {batches.length > 0 && (
          <>
            <p className="text-sm font-semibold">Batch yang Ada</p>
            <div className="space-y-2">
              {batches.map((b) => (
                <div key={b.id} className="rounded-lg border p-2">
                  {editingId === b.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                        }}
                        className="bg-white uppercase placeholder:text-black/30"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={pending}
                        className="h-9 shrink-0 border border-input bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
                      >
                        Ubah Batch
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        onClick={cancelEdit}
                        className="h-9 w-9 shrink-0 rounded-full border-0 bg-[#4B5563] text-white transition-colors hover:bg-[#374151]"
                        aria-label="Batalkan edit"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate font-medium">{b.name}</span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => startEdit(b)}
                          className="h-8 w-8 border border-input bg-transparent text-black transition-colors hover:bg-yellow-400 hover:text-black"
                          aria-label={`Edit batch ${b.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <ConfirmDeleteButton
                          title="Hapus Batch"
                          description={`Apakah anda benar ingin menghapus batch "${b.name}"?`}
                          triggerLabel=""
                          size="icon"
                          successMessage={`${b.name} berhasil dihapus!`}
                          onConfirm={() => deleteBatch(b.id)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}