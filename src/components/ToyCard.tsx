"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Info, MoreVertical, Pencil, Tag, Trash2, ImageIcon, ToyBrick, Banknote, Boxes } from "lucide-react";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FormatBadge } from "@/components/FormatBadge";

type ToyDTO = {
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

function statusBadgeClass(status: ToyDTO["status"]) {
  return status === "PRE_ORDER"
    ? "border-amber-300 bg-yellow-300 text-yellow-900"
    : "border-emerald-300 bg-emerald-100 text-emerald-800";
}

function CardThumb({ toy }: { toy: ToyDTO }) {
  if (!toy.image) {
    return (
      <div className="flex h-28 w-full items-center justify-center rounded-lg border-2 border-dashed border-[#D97A7A]/50 bg-[#FED6D6]/20 text-[#D97A7A]/70">
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }
  return (
    <div className="relative h-28 w-full overflow-hidden rounded-lg border border-input bg-black/5">
      <Image src={toy.image} alt={toy.title} fill sizes="160px" className="object-cover object-center" />
    </div>
  );
}

export function ToyCard({ toy, onDelete }: { toy: ToyDTO; onDelete: () => void }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: "#F6F1E7" }}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 font-semibold leading-snug">
          <ToyBrick className="h-4 w-4 shrink-0 text-[#D97A7A]" />
          <span className="line-clamp-2">{toy.title}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="outline" className={cn("text-xs", statusBadgeClass(toy.status))}>
            {toy.status === "PRE_ORDER" ? "Pre Order" : "Ready Stok"}
          </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Aksi toy"
              className="h-8 w-8 shrink-0 border border-black/10 bg-black/10 text-black hover:bg-black/20 hover:text-black"
            >
              <MoreVertical className="h-5 w-5" />
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

      <div className="mb-2 h-px w-full bg-black/15" />

      <div className="flex gap-3">
        <div className="w-24 shrink-0">
          <CardThumb toy={toy} />
        </div>
        <div className="min-w-0 flex-1 space-y-2.5 pt-1 text-sm">
          <div className="flex items-center gap-1.5">
            <HintIcon icon={<Building2 className="h-3.5 w-3.5 shrink-0" />} title="Publisher" detail={toy.publisher || "—"} />
            <span className="line-clamp-1 text-muted-foreground">{toy.publisher || "—"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HintIcon icon={<Info className="h-3.5 w-3.5 shrink-0" />} title="Informasi" detail={toy.info || "—"} />
            <span className="line-clamp-2 text-black/80">{toy.info ? toy.info : "—"}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 h-px w-full bg-black/15" />

      <div className="mt-2 flex items-center gap-1.5 text-sm">
        <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="flex flex-wrap gap-1">
          {toy.formats.length > 0 ? (
            toy.formats.map((f) => <FormatBadge key={f} value={f} />)
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </div>

      <div className="mt-2 h-px w-full bg-black/15" />

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Banknote className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-semibold">{formatIDR(toy.price)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span
            className={cn(
              "inline-flex h-6 w-9 items-center justify-center whitespace-nowrap rounded-full border text-xs",
              stockBadgeClass(toy.stock)
            )}
          >
            {toy.stock}
          </span>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[90%] max-w-sm" style={{ backgroundColor: "#FED6D6" }}>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription className="text-black/80">
              Apakah anda benar ingin menghapus toy &quot;{toy.title}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="flex-1 border border-input bg-transparent"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                setDeleteOpen(false);
                onDelete();
              }}
              className="flex-1 border border-input bg-transparent text-black transition-colors hover:bg-red-500 hover:text-white"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}