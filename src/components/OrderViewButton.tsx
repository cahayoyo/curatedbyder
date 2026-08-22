"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { OrderDetailDialog, type OrderDTO } from "@/components/OrderDetailDialog";

export function OrderViewButton({ order }: { order: OrderDTO }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 border border-input bg-transparent px-3 text-xs text-black shadow-sm transition-colors hover:bg-sky-400 hover:text-black"
      >
        <Eye className="h-3.5 w-3.5" />
        Lihat
      </Button>
      <OrderDetailDialog order={order} open={open} onOpenChange={setOpen} />
    </>
  );
}