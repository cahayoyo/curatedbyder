"use client";

import { useState } from "react";
import Image from "next/image";
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
import { ImageIcon, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

type ToyVariant = {
  key: string;
  label: string;
  price: number;
};

type ToyDTO = {
  id: string;
  title: string;
  image: string | null;
  info: string | null;
  stock: number;
  status: "READY_STOCK" | "PRE_ORDER";
  variants: ToyVariant[];
};

function stockChipClass(stock: number) {
  if (stock <= 0) return "border-red-200 bg-red-100 text-red-700";
  if (stock <= 10) return "border-amber-200 bg-yellow-100 text-amber-800";
  return "border-emerald-200 bg-emerald-100 text-emerald-700";
}

export function ToyCard({
  toy,
  onDelete,
}: {
  toy: ToyDTO;
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
      success(`${toy.title} berhasil dihapus!`);
    } catch (e) {
      error(e instanceof Error ? e.message : "Gagal menghapus");
    }
  }

  return (
    <div className="rounded-xl border bg-[#FDF1F1] p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-black/5">
          {toy.image ? (
            <Image
              src={toy.image}
              alt={toy.title}
              fill
              sizes="64px"
              className="object-cover object-center"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-5 w-5 text-black/30" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <p className="line-clamp-2 text-[15px] font-semibold leading-snug">
              {toy.title}
            </p>
            <div className="flex shrink-0 items-center gap-0.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                  toy.status === "PRE_ORDER"
                    ? "border-amber-200 bg-yellow-100 text-amber-800"
                    : "border-emerald-200 bg-emerald-100 text-emerald-700"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    toy.status === "PRE_ORDER" ? "bg-amber-500" : "bg-emerald-500"
                  )}
                />
                {toy.status === "PRE_ORDER" ? "Pre Order" : "Ready Stok"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Aksi mainan"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-black"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" style={{ backgroundColor: "#FED6D6" }}>
                  <DropdownMenuItem
                    onSelect={() => router.push(`/admin/toys/${toy.id}/edit`)}
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
          </div>

          <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">
            {toy.info || "—"}
          </p>

          <div className="mt-2 space-y-1.5">
            {toy.variants.map((v, vi) => (
              <div
                key={v.key}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={
                      v.label === "Utama"
                        ? "inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-700"
                        : "inline-flex items-center rounded-full border border-[#F0CBCB] bg-[#FDF1F1] px-2 py-0.5 text-xs font-medium text-[#C96A6A]"
                    }
                  >
                    {v.label}
                  </span>
                  <span className="whitespace-nowrap text-[15px] font-semibold">
                    {formatIDR(v.price)}
                  </span>
                </div>
                {vi === toy.variants.length - 1 && (
                  <span
                    className={cn(
                      "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
                      stockChipClass(toy.stock)
                    )}
                  >
                    Stok {toy.stock}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Konfirmasi Hapus"
        description={`Apakah anda benar ingin menghapus mainan "${toy.title}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
