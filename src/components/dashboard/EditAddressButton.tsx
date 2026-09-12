"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSuccessModal } from "@/components/SuccessModal";
import { updateMyAddress } from "@/server/actions/profile";
import { Loader2, MapPin, Save } from "lucide-react";

export function EditAddressButton({ contact }: { contact: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(contact ?? "");
  const [pending, startTransition] = useTransition();
  const { success, error } = useSuccessModal();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await updateMyAddress({ contact: value.trim() || null });
        if (!res.ok) {
          error(res.error);
          return;
        }
        setOpen(false);
        success("Alamat berhasil diperbarui!");
        router.refresh();
      } catch (err) {
        error(err instanceof Error ? err.message : "Gagal menyimpan alamat");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setValue(contact ?? "");
          setOpen(true);
        }}
        className="rounded-lg border border-[#E58A8A] bg-white px-3 py-1.5 text-xs font-semibold text-[#D97A7A] transition-colors hover:bg-[#FBE6E6]"
      >
        Ubah
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-[90%] max-w-md gap-5 rounded-2xl border-none p-6 shadow-xl sm:rounded-2xl [&>button.absolute]:bg-[#EDEBE8] [&>button.absolute]:text-[#4B5563] [&>button.absolute]:hover:bg-[#E2DFDB]"
          style={{ backgroundColor: "#FDF2F2" }}
        >
          <DialogHeader className="space-y-3 text-center sm:text-center">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#F9D2D8]" />
              <MapPin className="relative h-9 w-9 text-[#C96A6A]" />
            </div>
            <DialogTitle className="text-center text-xl font-bold text-black">
              Ubah Alamat
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-[#6B7280]">
              Alamat ini dipakai untuk pengiriman pesanan kamu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-2">
            <Label htmlFor="profile-address">Alamat Lengkap</Label>
            <Textarea
              id="profile-address"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={4}
              placeholder="Tulis alamat lengkap..."
              maxLength={500}
              className="text-base placeholder:text-[#b5b5b5]"
            />
            <p className="text-[13px] text-muted-foreground">
              Kosongkan jika ingin menghapus alamat.
            </p>

            <DialogFooter className="mt-3 flex-row gap-3 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="h-11 flex-1 rounded-xl border border-[#D9D2CC] bg-white text-sm font-semibold text-black transition-colors hover:bg-black/[0.03] hover:text-black"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="h-11 flex-1 rounded-xl bg-[#D97A7A] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#c9686b]"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
