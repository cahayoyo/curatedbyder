"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SortSelect({
  basePath,
  options,
  param = "sort",
  defaultValue = "desc",
  className,
}: {
  basePath: string;
  options: { value: string; label: string }[];
  param?: string;
  defaultValue?: string;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const current = searchParams.get(param);
  const value = options.some((o) => o.value === current) ? current! : defaultValue;

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === defaultValue) params.delete(param);
    else params.set(param, next);
    params.delete("page");
    startTransition(() => router.replace(`${basePath}?${params.toString()}`));
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Urutkan"
        disabled={isPending}
        className={cn("h-9 w-auto shrink-0 gap-1.5 bg-white", isPending && "cursor-wait opacity-70", className)}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#D97A7A]" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-[#B85C5C]" />
        )}
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
