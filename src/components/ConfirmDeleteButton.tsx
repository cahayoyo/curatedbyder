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
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actionResult";
import { useSuccessModal } from "@/components/SuccessModal";

export function ConfirmDeleteButton({
  title,
  description,
  label = "Hapus",
  triggerLabel,
  size = "sm",
  pendingLabel = "Menghapus...",
  successMessage = "Berhasil dihapus",
  onConfirm,
}: {
  title: string;
  description: string;
  label?: string;
  triggerLabel?: string;
  size?: "sm" | "icon";
  pendingLabel?: string;
  successMessage?: string;
  onConfirm: () => Promise<void | ActionResult> | void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { success } = useSuccessModal();

  function handleDelete() {
    startTransition(async () => {
      try {
        const res = await onConfirm();
        if (res && !res.ok) {
          toast.error(res.error);
          return;
        }
        setOpen(false);
        success(successMessage);
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
        size={size}
        onClick={() => setOpen(true)}
        className={
          size === "icon"
            ? "h-8 w-8 border border-input bg-transparent text-destructive transition-colors hover:bg-red-500 hover:text-white"
            : "h-9 border border-input bg-transparent px-3 text-xs text-destructive transition-colors hover:bg-red-500 hover:text-white"
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
        {size === "icon" ? null : (triggerLabel ?? label)}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[90%] max-w-sm rounded-xl bg-[#F6F1E7] shadow-lg sm:rounded-xl">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">{title}</DialogTitle>
            <DialogDescription className="text-center text-black/70">
              {description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:space-x-0">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border border-input bg-transparent text-black transition-colors hover:bg-black/5"
            >
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              disabled={pending}
              className="flex-1 bg-red-600 text-white shadow-sm transition-colors hover:bg-red-500"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {pendingLabel}
                </>
              ) : (
                label
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}