"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/actionResult";
import { useSuccessModal } from "@/components/SuccessModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteButton";
import { Building2, Info, MoreVertical, Pencil, Tag, Trash2, ImageIcon, BookOpen, Banknote, Boxes } from "lucide-react";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FormatBadge } from "@/components/FormatBadge";

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
          <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-md border border-black/10 bg-white p-1.5 text-[11px] leading-snug shadow-md">
            <p className="font-semibold">{title}</p>
            <p className="text-black/70">{detail || "—"}</p>
          </div>
        </>
      )}
    </div>
  );
}

function stockBadgeClass(stock: number) {
  if (stock <= 0) return "border-red-300 bg-red-500 text-white";
  if (stock <= 10) return "border-amber-300 bg-yellow-300 text-yellow-900";
  return "border-transparent bg-primary text-primary-foreground";
}

function statusBadgeClass(status: BookDTO["status"]) {
  return status === "PRE_ORDER"
    ? "border-amber-300 bg-yellow-300 text-yellow-900"
    : "border-emerald-300 bg-emerald-100 text-emerald-800";
}

function CardThumb({ book }: { book: BookDTO }) {
  if (!book.image) {
    return (
      <div className="flex h-28 w-full items-center justify-center rounded-lg border-2 border-dashed border-[#D97A7A]/50 bg-[#FED6D6]/20 text-[#D97A7A]/70">
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }
  return (
    <div className="relative h-28 w-full overflow-hidden rounded-lg border border-input bg-black/5">
      <Image src={book.image} alt={book.title} fill sizes="160px" className="object-cover object-center" />
    </div>
  );
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
    <div className="rounded-lg border p-3" style={{ backgroundColor: "#F6F1E7" }}>
      {/* Header: title + status badge + 3-dot menu */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 font-semibold leading-snug">
          <BookOpen className="h-4 w-4 shrink-0 text-[#D97A7A]" />
          <span className="line-clamp-2">{book.title}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="outline" className={cn("text-xs", statusBadgeClass(book.status))}>
            {book.status === "PRE_ORDER" ? "Pre Order" : "Ready Stok"}
          </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Aksi buku"
              className="h-8 w-8 shrink-0 border border-black/10 bg-black/10 text-black hover:bg-black/20 hover:text-black"
            >
              <MoreVertical className="h-5 w-5" />
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
      </div>

      {/* Divider under title */}
      <div className="mb-2 h-px w-full bg-black/15" />

      {/* Body: image left, publisher + info right */}
      <div className="flex gap-3">
        <div className="w-24 shrink-0">
          <CardThumb book={book} />
        </div>
        <div className="min-w-0 flex-1 space-y-2.5 pt-1 text-sm">
          <div className="flex items-center gap-1.5">
            <HintIcon icon={<Building2 className="h-3.5 w-3.5 shrink-0" />} title="Publisher" detail={book.publisher || "—"} />
            <span className="line-clamp-1 text-muted-foreground">{book.publisher || "—"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HintIcon icon={<Info className="h-3.5 w-3.5 shrink-0" />} title="Informasi" detail={book.info || "—"} />
            <span className="line-clamp-2 text-black/80">{book.info ? book.info : "—"}</span>
          </div>
        </div>
      </div>

      {/* Divider under image body */}
      <div className="mt-2 h-px w-full bg-black/15" />

      {/* Format */}
      <div className="mt-2 flex items-center gap-1.5 text-sm">
        <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="flex flex-wrap gap-1">
          {book.formats.length > 0 ? (
            book.formats.map((f) => <FormatBadge key={f} value={f} />)
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </div>

      {/* Divider under format */}
      <div className="mt-2 h-px w-full bg-black/15" />

      {/* Price + stock */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Banknote className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-semibold">{formatIDR(book.price)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span
            className={cn(
              "inline-flex h-6 w-9 items-center justify-center whitespace-nowrap rounded-full border text-xs",
              stockBadgeClass(book.stock)
            )}
          >
            {book.stock}
          </span>
        </div>
      </div>

      {/* Delete confirm dialog */}
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