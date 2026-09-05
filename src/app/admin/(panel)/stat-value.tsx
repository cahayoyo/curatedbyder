"use client";

import { useRangePending } from "./range-provider";
import { cn } from "@/lib/utils";

export function StatValue({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  const pending = useRangePending();
  if (!pending) return <p className={className}>{value}</p>;

  // skeleton bar sized like the real text (one nbsp per character)
  return (
    <div
      aria-hidden
      className={cn(className, "inline-block animate-pulse select-none rounded bg-[#F0CBCB]")}
    >
      {"\u00A0".repeat(Math.min(String(value).length, 14))}
    </div>
  );
}
