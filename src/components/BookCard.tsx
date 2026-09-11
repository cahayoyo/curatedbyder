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

type BookDTO = {
  id: string;
  title: string;
  image: string | null;
  publisher: string | null;
  info: string | null;
  formats: string[];
  price: number;
  stock: number;
  status: "READY_STOCK" | "PRE_ORDER";
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
    <div className="flex gap-3 rounded-xl border border-[#F5D9D3] bg-[#FCEBE6] p-3 shadow-sm">
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
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{book.title}</p>
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
            <DropdownMenuContent align="end" style={{ backgroundColor: "#FED6D6" }}>
              <DropdownMenuItem
                onSelect={() => router.push(`/admin/books/${book.id}/edit`)}
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

        <div className="mt-1 flex flex-wrap items-center gap-1">
          {book.formats.map((f) => (
            <FormatBadge key={f} value={f} />
          ))}
          <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-1.5 text-[11px] font-medium text-purple-700">
            Utama
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[15px] font-semibold">{formatIDR(book.price)}</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stockChipClass(book.stock)}`}
            >
              Stok {book.stock}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                book.status === "PRE_ORDER"
                  ? "border-amber-200 bg-yellow-100 text-amber-800"
                  : "border-emerald-200 bg-emerald-100 text-emerald-700"
              }`}
            >
              {book.status === "PRE_ORDER" ? "Pre Order" : "Ready Stok"}
            </span>
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
