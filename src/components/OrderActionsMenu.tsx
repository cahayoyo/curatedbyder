"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { OrderViewButton } from "@/components/OrderViewButton";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteButton";
import { useSuccessModal } from "@/components/SuccessModal";
import type { OrderDTO } from "@/components/OrderDetailDialog";
import type { ActionResult } from "@/lib/actionResult";

export function OrderActionsMenu({
  order,
  onDelete,
  deleteSuccessMessage,
}: {
  order: OrderDTO;
  onDelete: () => Promise<void | ActionResult> | void;
  deleteSuccessMessage: string;
}) {
  const router = useRouter();
  const { success, error } = useSuccessModal();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDelete() {
    try {
      const res = await onDelete();
      if (res && !res.ok) {
        error(res.error, {
          title: res.title,
          hint: res.hint,
          emphasis: res.emphasis,
        });
        return;
      }
      setDeleteOpen(false);
      success(deleteSuccessMessage);
      router.refresh();
    } catch (e) {
      error(e instanceof Error ? e.message : "Gagal menghapus");
    }
  }

  return (
    <>
      <div className="flex items-center justify-start gap-2">
        <OrderViewButton order={order} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Aksi lainnya"
              className="h-9 w-9 border border-input bg-transparent text-black shadow-sm transition-colors hover:bg-black/5"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => router.push(`/admin/orders/${order.id}/edit`)}
              className="cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              Ubah
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Order?"
        description={`Apakah anda benar ingin menghapus order "${order.invoiceNumber}"? Stok buku akan dikembalikan.`}
        warningText="Data order yang dihapus tidak akan bisa dikembalikan."
        onConfirm={handleDelete}
      />
    </>
  );
}
