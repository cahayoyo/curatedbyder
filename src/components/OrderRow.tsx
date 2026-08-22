"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, updatePaymentStatus } from "@/server/actions/orders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUSES, PAYMENT_STATUSES } from "@/lib/orderOptions";
import { toast } from "sonner";

export function StatusSelect({ orderId, current }: { orderId: string; current: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, value);
        toast.success("Status updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  return (
    <Select value={current} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="w-44">
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
      <SelectTrigger className="w-32">
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