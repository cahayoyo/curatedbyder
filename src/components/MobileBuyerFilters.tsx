"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/SearchInput";
import { BookSortSelect, type SortOption } from "@/components/BookSortSelect";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";

export const BUYER_SORT_OPTIONS: SortOption[] = [
  { value: "default", label: "Terbaru", sort: "", dir: "" },
  { value: "username-asc", label: "Username A - Z", sort: "username", dir: "asc" },
  { value: "username-desc", label: "Username Z - A", sort: "username", dir: "desc" },
  { value: "name-asc", label: "Nama A - Z", sort: "name", dir: "asc" },
  { value: "name-desc", label: "Nama Z - A", sort: "name", dir: "desc" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Semua", dot: "bg-[#D97A7A]" },
  { value: "aktif", label: "Aktif", dot: "bg-emerald-500" },
  { value: "tidak", label: "Tidak Aktif", dot: "bg-amber-500" },
] as const;

export function MobileBuyerFilters({ basePath }: { basePath: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggleOpen() {
    const next = !open;
    if (next) setStatus(searchParams.get("status") ?? "");
    setOpen(next);
  }

  function push(statuses: string, close = false) {
    const params = new URLSearchParams(searchParams.toString());
    if (statuses) params.set("status", statuses);
    else params.delete("status");
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath);
    if (close) setOpen(false);
  }

  function reset() {
    setStatus("");
    push("", true);
  }

  return (
    <div className="space-y-2 md:hidden">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchInput
            basePath={basePath}
            placeholder="Cari pembeli..."
            inputClassName="bg-white text-[15px]"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={toggleOpen}
          className="h-10 shrink-0 gap-1.5 border-[#F0CBCB] bg-[#FDF1F1] px-3 text-[15px] font-medium text-[#C96A6A] hover:bg-[#F9DEDE] hover:text-[#C96A6A]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {open && (
        <div className="space-y-3 rounded-xl border bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[15px] font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-[#C96A6A]" />
              Filter Pembeli
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup filter"
              className="text-muted-foreground transition-colors hover:text-black"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-[13px] text-muted-foreground">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((o) => {
                const active = status === o.value;
                return (
                  <button
                    key={o.value || "all"}
                    type="button"
                    onClick={() => setStatus(o.value)}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
                      active
                        ? "border-[#F0CBCB] bg-[#FDF1F1] text-[#C96A6A]"
                        : "border-input bg-white text-black/70 hover:bg-[#FDF1F1]"
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", o.dot)} />
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[13px] text-muted-foreground">Urutkan</p>
            <BookSortSelect
              basePath={basePath}
              options={BUYER_SORT_OPTIONS}
              triggerClassName="h-10 w-full text-[15px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              className="h-10 flex-1 gap-1.5 border-transparent bg-transparent text-[15px] text-[#C96A6A] hover:bg-[#FDF1F1] hover:text-[#C96A6A]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              type="button"
              onClick={() => push(status, true)}
              className="h-10 flex-[1.6] bg-[#D97A7A] text-[15px] text-white hover:bg-[#c96666]"
            >
              Terapkan Filter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
