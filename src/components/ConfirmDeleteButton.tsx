"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ConfirmDeleteButton({
  title,
  description,
  label = "Hapus",
  pendingLabel = "Menghapus...",
  successMessage = "Berhasil dihapus",
  onConfirm,
}: {
  title: string;
  description: string;
  label?: string;
  pendingLabel?: string;
  successMessage?: string;
  onConfirm: () => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await onConfirm();
        setOpen(false);
        toast.success(successMessage);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal menghapus");
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="border border-input text-destructive transition-colors hover:bg-red-500 hover:text-white"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[90%] max-w-sm" style={{ backgroundColor: "#FED6D6" }}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="text-black/80">{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border border-input bg-transparent"
            >
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              disabled={pending}
              className="flex-1 border border-input bg-transparent text-black transition-colors hover:bg-red-500 hover:text-white"
            >
              {pending ? pendingLabel : label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}