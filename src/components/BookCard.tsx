"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteButton";
import { useSuccessModal } from "@/components/SuccessModal";
import { FormatBadge } from "@/components/FormatBadge";
import { formatIDR } from "@/lib/format";
import type { ActionResult } from "@/lib/actionResult";
import { ImageIcon, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type BookVariant = {
  key: string;
  label: string;
  price: number;
  formats: string[];
};

type BookDTO = {
  id: string;
  title: string;
  image: string | null;
  publisher: string | null;
  stock: number;
  status: "READY_STOCK" | "PRE_ORDER";
  variants: BookVariant[];
};

function stockChipClass(stock: number) {
  if (stock <= 0)
    return "border-red-200 bg-red-100 text-red-700";
  if (stock <= 10)
    return "border-amber-200 bg-yellow-100 text-amber-800";
  return "border-emerald-200 bg-emerald-100 text-emerald-700";
}

export function BookCard({
  book,
  onDelete,
}: {
  book: BookDTO;
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
      success(`${book.title} berhasil dihapus!`);
    } catch (e) {
      error(e instanceof Error ? e.message : "Gagal menghapus");
    }
  }

  return (
    <div className="rounded-xl border bg-[#FDF1F1] p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border bg-black/5">
          {book.image ? (
            <Image
              src={book.image}
              alt={book.title}
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
              {book.title}
            </p>
            <div className="flex shrink-0 items-center gap-0.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                  book.status === "PRE_ORDER"
                    ? "border-amber-200 bg-yellow-100 text-amber-800"
                    : "border-emerald-200 bg-emerald-100 text-emerald-700"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    book.status === "PRE_ORDER" ? "bg-amber-500" : "bg-emerald-500"
                  )}
                />
                {book.status === "PRE_ORDER" ? "Pre Order" : "Ready Stok"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Aksi buku"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-black"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-[#F0CBCB] bg-white">
                  <DropdownMenuItem
                    onSelect={() => router.push(`/admin/books/${book.id}/edit`)}
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
            </div>
          </div>

          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Publisher: {book.publisher || "—"}
          </p>

          <div className="mt-2 space-y-1.5">
            {book.variants.map((v, vi) => (
              <div
                key={v.key}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {v.label !== "Utama" && (
                    <span className="inline-flex items-center rounded-full border border-[#F0CBCB] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#C96A6A]">
                      {v.label}
                    </span>
                  )}
                  {v.formats.length > 0 ? (
                    v.formats.map((f) => <FormatBadge key={f} value={f} />)
                  ) : (
                    v.label === "Utama" && (
                      <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-700">
                        {v.label}
                      </span>
                    )
                  )}
                  <span className="whitespace-nowrap text-[15px] font-semibold">
                    {formatIDR(v.price)}
                  </span>
                </div>
                {vi === book.variants.length - 1 && (
                  <span
                    className={cn(
                      "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
                      stockChipClass(book.stock)
                    )}
                  >
                    Stok {book.stock}
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
        description={`Apakah anda benar ingin menghapus buku "${book.title}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
