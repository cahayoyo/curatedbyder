"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuyerOrderDetail, OrderDTO, openAdminWa } from "@/components/BuyerTabs";

export function OrderDetailButton({
  order,
  className,
  children,
}: {
  order: OrderDTO;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <BuyerOrderDetail order={order} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function PayNowButton({ order }: { order: OrderDTO }) {
  return (
    <Button
      type="button"
      onClick={() => openAdminWa(order)}
      className="w-full bg-[#D97A7A] text-white hover:bg-[#c9686b]"
    >
      <Wallet className="h-4 w-4" />
      Bayar Sekarang
    </Button>
  );
}
