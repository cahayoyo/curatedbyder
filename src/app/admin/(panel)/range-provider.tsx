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
    <label className="flex h-full w-fit items-center gap-3 rounded-xl bg-[#FBE6E6] px-5 py-3">
      {pending ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#C96A6A]" />
      ) : (
        <CalendarDays className="h-6 w-6 shrink-0 text-[#C96A6A]" />
      )}
      <select
        value={value ?? ""}
        aria-label="Pilih rentang statistik"
        onChange={(e) => select(e.target.value)}
        className="h-full bg-transparent py-1.5 text-sm font-bold text-[#B04A4A] outline-none"
      >
        <option value="">All Time</option>
        <option value="7">Last 7 Days</option>
        <option value="14">Last 14 Days</option>
        <option value="30">Last 30 Days</option>
      </select>
    </label>
  );
}
