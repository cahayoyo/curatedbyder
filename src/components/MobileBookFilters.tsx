"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/SearchInput";
import { ParamSelect } from "@/components/ParamSelect";
import { BookSortSelect } from "@/components/BookSortSelect";
import { Button } from "@/components/ui/button";
import { FORMATS, BOOK_STATUSES } from "@/lib/orderOptions";
import { Building2, CircleCheckBig, RotateCcw, SlidersHorizontal, Tag, X } from "lucide-react";

export function MobileBookFilters({
  basePath,
  publisherOptions,
}: {
  basePath: string;
  publisherOptions: string[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  function reset() {
    const params = new URLSearchParams(searchParams.toString());
    ["publisher", "format", "status", "min", "max", "sort", "dir", "page"].forEach((k) =>
      params.delete(k)
    );
    const qs = params.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath);
  }

  const formatOptions = FORMATS.map((f) => ({ value: f.value, label: f.label }));
  const statusOptions = BOOK_STATUSES.map((s) => ({ value: s.value, label: s.label }));
  const publisherSelectOptions = publisherOptions.map((p) => ({
    value: p,
    label: p,
  }));

  return (
    <div className="space-y-2 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchInput
            basePath={basePath}
            placeholder="Cari judul buku..."
            inputClassName="bg-white text-[15px]"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((o) => !o)}
          className="h-10 shrink-0 gap-1.5 border-[#F0CBCB] bg-[#FDF1F1] px-3 text-[15px] font-medium text-[#C96A6A] hover:bg-[#F9DEDE] hover:text-[#C96A6A]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {open ? <X className="h-3.5 w-3.5" /> : null}
        </Button>
      </div>

      {open && (
        <div className="space-y-3 rounded-xl border bg-white p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[13px] text-muted-foreground">Publisher</p>
              <ParamSelect
                basePath={basePath}
                param="publisher"
                placeholder="Semua Publisher"
                options={publisherSelectOptions}
                icon={<Building2 className="h-3.5 w-3.5" />}
              />
            </div>
            <div className="space-y-1">
              <p className="text-[13px] text-muted-foreground">Format</p>
              <ParamSelect
                basePath={basePath}
                param="format"
                placeholder="Semua Format"
                options={formatOptions}
                icon={<Tag className="h-3.5 w-3.5" />}
              />
            </div>
            <div className="space-y-1">
              <p className="text-[13px] text-muted-foreground">Status</p>
              <ParamSelect
                basePath={basePath}
                param="status"
                placeholder="Semua Status"
                options={statusOptions}
                icon={<CircleCheckBig className="h-3.5 w-3.5" />}
              />
            </div>
            <div className="space-y-1">
              <p className="text-[13px] text-muted-foreground">Urutkan</p>
              <BookSortSelect basePath={basePath} triggerClassName="h-10 w-full text-[15px]" />
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
              onClick={() => setOpen(false)}
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
