"use client";

import { useState, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function WhatsAppConfirmButton({
  href,
  title = "Hubungi Admin via WhatsApp?",
  message,
  trigger,
  triggerClassName,
}: {
  href: string;
  title?: string;
  message: ReactNode;
  trigger: ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(triggerClassName)}>
        {trigger}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[90%] max-w-md gap-5 rounded-2xl border-none bg-[#FDF7F3] p-6 shadow-xl sm:rounded-2xl [&>button.absolute]:bg-[#EDEBE8] [&>button.absolute]:text-[#4B5563] [&>button.absolute]:hover:bg-[#E2DFDB]">
          <DialogHeader className="space-y-3 text-center sm:text-center">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#D9F2E1]" />
              <MessageCircle className="relative h-9 w-9 text-[#1EBE5A]" />
            </div>
            <DialogTitle className="text-center text-xl font-bold text-black">
              {title}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-[#6B7280]">
              {message}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-row gap-3 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-11 flex-1 rounded-xl border border-[#D9D2CC] bg-white text-sm font-semibold text-black transition-colors hover:bg-black/[0.03] hover:text-black"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => {
                window.open(href, "_blank", "noopener,noreferrer");
                setOpen(false);
              }}
              className="h-11 flex-1 rounded-xl bg-[#25D366] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1EBE5A]"
            >
              <MessageCircle className="h-4 w-4" />
              Lanjutkan ke WA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
