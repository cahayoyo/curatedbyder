"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/actionResult";
import { useSuccessModal } from "@/components/SuccessModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteButton";
import { cn } from "@/lib/utils";
import { avatarClass, initials } from "@/lib/avatar";
import { MapPin, MoreVertical, Pencil, Phone, Trash2 } from "lucide-react";

type BuyerDTO = {
  id: string;
  username: string | null;
  name: string;
  phone: string | null;
  contact: string | null;
};

export function BuyerCard({
  buyer,
  onDelete,
}: {
  buyer: BuyerDTO;
  onDelete: () => Promise<ActionResult | void> | void;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { success, error } = useSuccessModal();

  async function handleDelete() {
    try {
      const res = await onDelete();
      if (res && !res.ok) {
        error(res.error);
        return;
      }
      success(`${buyer.name} berhasil dihapus!`);
    } catch (e) {
      error(e instanceof Error ? e.message : "Gagal menghapus");
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border bg-[#FDF1F1] p-3 shadow-sm">
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-bold",
          avatarClass(buyer.name)
        )}
      >
        {initials(buyer.name)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[15px] font-semibold leading-snug">{buyer.name}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{buyer.username || "-"}</p>
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          {buyer.phone || "-"}
        </p>
        <p className="mt-1 flex items-start gap-1.5 text-[13px] text-black/70">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2">{buyer.contact?.trim() ? buyer.contact : "-"}</span>
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Aksi pembeli"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-black"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="border-[#F0CBCB] bg-white">
          <DropdownMenuItem
            onSelect={() => router.push(`/admin/buyers/${buyer.id}/edit`)}
            className="cursor-pointer text-[#D97A7A] hover:bg-[#F9DEDE] hover:text-[#D97A7A] focus:bg-[#F9DEDE] focus:text-[#D97A7A]"
          >
            <Pencil className="h-4 w-4" />
            Ubah
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="cursor-pointer text-[#D97A7A] hover:bg-[#F9DEDE] hover:text-[#D97A7A] focus:bg-[#F9DEDE] focus:text-[#D97A7A]"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Pembeli?"
        description={`Apakah anda benar ingin menghapus pembeli "${buyer.name}"?`}
        warningText={`Data pembeli yang dihapus tidak akan bisa dikembalikan.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
