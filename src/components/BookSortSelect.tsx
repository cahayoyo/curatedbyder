"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOption = { value: string; label: string; sort: string; dir: string };

export const BOOK_SORT_OPTIONS: SortOption[] = [
  { value: "default", label: "Terbaru", sort: "", dir: "" },
  { value: "title-asc", label: "Judul A - Z", sort: "title", dir: "asc" },
  { value: "title-desc", label: "Judul Z - A", sort: "title", dir: "desc" },
  { value: "price-asc", label: "Harga Terendah", sort: "price", dir: "asc" },
  { value: "price-desc", label: "Harga Tertinggi", sort: "price", dir: "desc" },
  { value: "stock-asc", label: "Stok Terendah", sort: "stock", dir: "asc" },
  { value: "stock-desc", label: "Stok Tertinggi", sort: "stock", dir: "desc" },
];

export function BookSortSelect({
  basePath,
  triggerClassName,
  options = BOOK_SORT_OPTIONS,
}: {
  basePath: string;
  triggerClassName?: string;
  options?: SortOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") ?? "";
  const currentDir = searchParams.get("dir") ?? "";
  const value =
    options.find(
      (o) => o.sort === currentSort && (o.sort === "" || o.dir === currentDir)
    )?.value ?? "default";
  const label = options.find((o) => o.value === value)?.label ?? "Terbaru";

  function onChange(v: string) {
    const opt = options.find((o) => o.value === v);
    if (!opt) return;
    const params = new URLSearchParams(searchParams.toString());
    if (opt.sort) {
      params.set("sort", opt.sort);
      params.set("dir", opt.dir);
    } else {
      params.delete("sort");
      params.delete("dir");
    }
    params.delete("page");
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${basePath}?${qs}` : basePath));
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Urutkan"
        disabled={isPending}
        className={cn(
          "h-9 w-full bg-white text-[15px] text-black sm:w-40",
          isPending && "opacity-70",
          triggerClassName
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
