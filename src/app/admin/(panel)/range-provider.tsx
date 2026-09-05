"use client";

import { CalendarDays, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition, type ReactNode } from "react";

const RangeContext = createContext<{ pending: boolean; select: (v: string) => void }>({
  pending: false,
  select: () => {},
});

export const useRangePending = () => useContext(RangeContext).pending;

export function RangeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const select = (v: string) =>
    startTransition(() =>
      router.replace(v ? `/admin?r=${v}` : "/admin", { scroll: false })
    );

  return (
    <RangeContext.Provider value={{ pending, select }}>{children}</RangeContext.Provider>
  );
}

export function RangePicker({ value }: { value?: number }) {
  const { pending, select } = useContext(RangeContext);

  return (
    <label className="flex w-fit shrink-0 items-center gap-2 rounded-xl bg-[#FBE6E6] px-4 py-3 sm:gap-3 sm:px-5">
      {pending ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#C96A6A] sm:h-6 sm:w-6" />
      ) : (
        <CalendarDays className="h-5 w-5 shrink-0 text-[#C96A6A] sm:h-6 sm:w-6" />
      )}
      <select
        value={value ?? ""}
        aria-label="Pilih rentang statistik"
        onChange={(e) => select(e.target.value)}
        className="bg-transparent py-1.5 text-xs font-bold text-[#B04A4A] outline-none sm:text-sm"
      >
        <option value="">All Time</option>
        <option value="7">Last 7 Days</option>
        <option value="14">Last 14 Days</option>
        <option value="30">Last 30 Days</option>
      </select>
    </label>
  );
}
