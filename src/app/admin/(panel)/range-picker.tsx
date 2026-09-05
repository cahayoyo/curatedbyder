"use client";

import { CalendarDays, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function RangePicker({ value }: { value?: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex w-fit items-center gap-3 rounded-xl bg-[#FBE6E6] px-5 py-3">
      {pending ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#C96A6A]" />
      ) : (
        <CalendarDays className="h-6 w-6 shrink-0 text-[#C96A6A]" />
      )}
      <select
        value={value ?? ""}
        aria-label="Pilih rentang statistik"
        onChange={(e) => {
          const v = e.target.value;
          startTransition(() =>
            router.replace(v ? `/admin?r=${v}` : "/admin", { scroll: false })
          );
        }}
        className="bg-transparent text-sm font-bold text-[#B04A4A] outline-none"
      >
        <option value="">All Time</option>
        <option value="7">Last 7 Days</option>
        <option value="14">Last 14 Days</option>
        <option value="30">Last 30 Days</option>
      </select>
    </label>
  );
}
