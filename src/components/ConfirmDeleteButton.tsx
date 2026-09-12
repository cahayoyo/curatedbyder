"use client";

import { useState } from "react";
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
import type { ActionResult } from "@/lib/actionResult";
import { useSuccessModal } from "@/components/SuccessModal";
import { cn } from "@/lib/utils";

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  label = "Hapus",
  pendingLabel = "Menghapus...",
  warningTitle = "Tindakan ini tidak dapat dibatalkan.",
  warningText = "Data yang dihapus tidak akan bisa dikembalikan.",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label?: string;
  pendingLabel?: string;
  warningTitle?: string;
  warningText?: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-md gap-5 rounded-2xl border-none bg-[#FDF7F3] p-6 shadow-xl sm:rounded-2xl [&>button.absolute]:bg-[#EDEBE8] [&>button.absolute]:text-[#4B5563] [&>button.absolute]:hover:bg-[#E2DFDB]">
        <DialogHeader className="space-y-3 text-center sm:text-center">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-[#F9D2D8]" />
            <Trash2 className="relative h-9 w-9 text-[#E1445A]" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-black">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-[#6B7280]">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-xl bg-[#FCE9EC] p-3.5 text-left">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E1445A] text-[11px] font-bold leading-none text-white">
            !
          </span>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-black">{warningTitle}</p>
            <p className="text-sm text-[#6B7280]">{warningText}</p>
          </div>
        </div>

        <DialogFooter className="flex-row gap-3 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-xl border border-[#D9D2CC] bg-white text-sm font-semibold text-black transition-colors hover:bg-black/[0.03] hover:text-black"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="h-11 flex-1 rounded-xl bg-[#E02B3C] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#C72433]"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {pendingLabel}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                {label}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDeleteButton({
  title,
  description,
  label = "Hapus",
  triggerLabel,
  size = "sm",
  triggerClassName,
  pendingLabel = "Menghapus...",
  warningText,
  successMessage = "Berhasil dihapus",
  onConfirm,
}: {
  title: string;
  description: string;
  label?: string;
  triggerLabel?: string;
  size?: "sm" | "icon";
  triggerClassName?: string;
  pendingLabel?: string;
  warningText?: string;
  successMessage?: string;
  onConfirm: () => Promise<void | ActionResult> | void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { success, error } = useSuccessModal();

  async function handleDelete() {
    try {
      const res = await onConfirm();
      if (res && !res.ok) {
        error(res.error, {
          title: res.title,
          hint: res.hint,
          emphasis: res.emphasis,
        });
        return;
      }
      setOpen(false);
      success(successMessage);
      router.refresh();
    } catch (e) {
      error(e instanceof Error ? e.message : "Gagal menghapus");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={size}
        onClick={() => setOpen(true)}
        className={cn(
          size === "icon"
            ? "h-8 w-8 border border-input bg-transparent text-destructive transition-colors hover:bg-red-500 hover:text-white"
            : "h-9 border border-input bg-transparent px-3 text-xs text-destructive transition-colors hover:bg-red-500 hover:text-white",
          triggerClassName
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {size === "icon" ? null : (triggerLabel ?? label)}
      </Button>

      <ConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        label={label}
        pendingLabel={pendingLabel}
        warningText={warningText}
        onConfirm={handleDelete}
      />
    </>
  );
}
