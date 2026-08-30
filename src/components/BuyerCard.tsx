"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { MapPin, MoreVertical, Pencil, Phone, Trash2, Users } from "lucide-react";

type BuyerDTO = {
  id: string;
  username: string | null;
  name: string;
  phone: string | null;
  contact: string | null;
};

function HintIcon({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label={title}
        className="flex items-center justify-center rounded text-muted-foreground transition-colors hover:text-black"
      >
        {icon}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-md border border-black/10 bg-white p-1.5 text-[11px] leading-snug shadow-md">
            <p className="font-semibold">{title}</p>
            <p className="break-words text-black/70">{detail || "—"}</p>
          </div>
        </>
      )}
    </div>
  );
}

export function BuyerCard({
  buyer,
  onDelete,
}: {
  buyer: BuyerDTO;
  onDelete: () => Promise<ActionResult | void> | void;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { success } = useSuccessModal();

  async function handleDelete() {
    try {
      const res = await onDelete();
      if (res && !res.ok) {
        toast.error(res.error);
        return;
      }
      success(`${buyer.name} berhasil dihapus!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus");
    }
  }

  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: "#F6F1E7" }}>
      {/* Header: name + 3-dot menu */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 font-semibold leading-snug">
          <Users className="h-4 w-4 shrink-0 text-[#D97A7A]" />
          <span className="line-clamp-2">{buyer.username || buyer.name}</span>
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Aksi pembeli"
              className="h-8 w-8 shrink-0 border border-black/10 bg-black/10 text-black hover:bg-black/20 hover:text-black"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ backgroundColor: "#FED6D6" }}>
            <DropdownMenuItem
              onSelect={() => router.push(`/admin/buyers/${buyer.id}/edit`)}
              className="cursor-pointer text-black/80 hover:bg-[#D97A7A] hover:text-white focus:bg-[#D97A7A] focus:text-white"
            >
              <Pencil className="h-4 w-4" />
              Ubah
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              className="cursor-pointer text-red-600 hover:bg-red-500 hover:text-white focus:bg-red-500 focus:text-white"
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Divider under title */}
      <div className="mb-2 h-px w-full bg-black/15" />

      {/* Body: name, phone, address */}
      <div className="space-y-2.5 pt-1 text-sm">
        <div className="flex items-center gap-1.5">
          <HintIcon icon={<Users className="h-3.5 w-3.5 shrink-0" />} title="Nama Lengkap" detail={buyer.name} />
          <span className="line-clamp-1 text-muted-foreground">{buyer.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HintIcon icon={<Phone className="h-3.5 w-3.5 shrink-0" />} title="Nomor Telepon" detail={buyer.phone || "—"} />
          <span className="line-clamp-1 text-muted-foreground">{buyer.phone || "—"}</span>
        </div>
        <div className="flex items-start gap-1.5">
          <HintIcon icon={<MapPin className="h-3.5 w-3.5 shrink-0" />} title="Alamat" detail={buyer.contact || "—"} />
          <span className="line-clamp-2 text-black/80">{buyer.contact ? buyer.contact : "—"}</span>
        </div>
      </div>

      {/* Divider under body */}
      <div className="mt-2 h-px w-full bg-black/15" />

      {/* Delete confirm dialog */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Konfirmasi Hapus"
        description={`Apakah anda benar ingin menghapus pembeli "${buyer.name}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}