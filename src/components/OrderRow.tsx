"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderItemStatus, updatePaymentStatus } from "@/server/actions/orders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUSES,
  PAYMENT_STATUSES,
  STATUS_BADGE,
  PAYMENT_BADGE,
} from "@/lib/orderOptions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function StatusSelect({ itemId, current }: { itemId: string; current: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    startTransition(async () => {
      try {
        await updateOrderItemStatus(itemId, value);
        toast.success("Status item updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  return (
    <Select value={current} onValueChange={onChange} disabled={pending}>
      <SelectTrigger
        className={cn(
          "h-9 items-center whitespace-nowrap px-3 font-medium",
          STATUS_BADGE[current] ?? "border-gray-300 bg-gray-100 text-gray-700"
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PaymentStatusSelect({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    startTransition(async () => {
      try {
        await updatePaymentStatus(orderId, value);
        toast.success("Payment updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  return (
    <Select value={current} onValueChange={onChange} disabled={pending}>
      <SelectTrigger
        className={cn(
          "h-9 items-center whitespace-nowrap px-3 font-medium",
          PAYMENT_BADGE[current] ?? "border-red-300 bg-red-100 text-red-800"
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PAYMENT_STATUSES.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}