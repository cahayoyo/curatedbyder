"use client";

import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function MonthPicker({ value }: { value?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex w-fit items-center gap-3 rounded-xl bg-[#FBE6E6] px-5 py-3">
      <CalendarDays
        className={cn("h-6 w-6 shrink-0 text-[#C96A6A]", pending && "animate-pulse")}
      />
      <input
        type="month"
        value={value ?? ""}
        aria-label="Pilih bulan statistik"
        onChange={(e) => {
          const v = e.target.value;
          startTransition(() =>
            router.replace(v ? `/admin?m=${v}` : "/admin", { scroll: false })
          );
        }}
        className="bg-transparent text-sm font-bold text-[#B04A4A] outline-none [color-scheme:light]"
      />
    </label>
  );
}
