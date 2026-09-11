"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/SearchInput";
import { BookSortSelect } from "@/components/BookSortSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Semua", dot: "bg-[#D97A7A]" },
  { value: "READY_STOCK", label: "Ready Stok", dot: "bg-emerald-500" },
  { value: "PRE_ORDER", label: "Pre Order", dot: "bg-amber-500" },
] as const;

export function MobileToyFilters({ basePath }: { basePath: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggleOpen() {
    const next = !open;
    if (next) {
      setStatus(searchParams.get("status") ?? "");
      setMin(searchParams.get("min") ?? "");
      setMax(searchParams.get("max") ?? "");
    }
    setOpen(next);
  }

  function push(statuses: string, minV: string, maxV: string, close = false) {
    const params = new URLSearchParams(searchParams.toString());
    if (statuses) params.set("status", statuses);
    else params.delete("status");
    if (minV) params.set("min", minV);
    else params.delete("min");
    if (maxV) params.set("max", maxV);
    else params.delete("max");
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath);
    if (close) setOpen(false);
  }

  function apply() {
    push(status, min.replace(/\D/g, ""), max.replace(/\D/g, ""), true);
  }

  function reset() {
    setStatus("");
    setMin("");
    setMax("");
    push("", "", "", true);
  }

  return (
    <div className="space-y-2 md:hidden">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchInput
            basePath={basePath}
            placeholder="Cari nama mainan..."
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
              Filter Mainan
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
            <BookSortSelect basePath={basePath} triggerClassName="h-10 w-full text-[15px]" />
          </div>

          <div className="space-y-1">
            <p className="text-[13px] text-muted-foreground">Harga</p>
            <div className="flex items-center gap-2">
              <Input
                inputMode="numeric"
                value={min ? formatRp(min) : ""}
                onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
                placeholder="Rp Min"
                className="h-10 text-[15px] placeholder:text-black/30"
              />
              <Input
                inputMode="numeric"
                value={max ? formatRp(max) : ""}
                onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
                placeholder="Rp Max"
                className="h-10 text-[15px] placeholder:text-black/30"
              />
            </div>
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
              onClick={apply}
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
