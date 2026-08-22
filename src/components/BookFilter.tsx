"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { Label } from "@/components/ui/label";
import { formatRp } from "@/lib/format";
import { BOOK_STATUSES } from "@/lib/orderOptions";

export function BookFilter({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const urlStatus =
    searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const activeCount =
    urlStatus.length +
    (searchParams.get("min") ? 1 : 0) +
    (searchParams.get("max") ? 1 : 0);

  function toggleOpen() {
    const next = !open;
    if (next) {
      setStatus(urlStatus);
      setMin(searchParams.get("min") ?? "");
      setMax(searchParams.get("max") ?? "");
    }
    setOpen(next);
  }

  function toggleStatus(v: string) {
    const next = status.includes(v)
      ? status.filter((x) => x !== v)
      : [...status, v];
    setStatus(next);
    push(next, min.replace(/\D/g, ""), max.replace(/\D/g, ""));
  }

  function push(
    statuses: string[],
    minV: string,
    maxV: string,
    close = false
  ) {
    const params = new URLSearchParams(searchParams.toString());
    if (statuses.length) params.set("status", statuses.join(","));
    else params.delete("status");
    if (minV) params.set("min", minV);
    else params.delete("min");
    if (maxV) params.set("max", maxV);
    else params.delete("max");
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
    if (close) setOpen(false);
  }

  function reset() {
    setStatus([]);
    setMin("");
    setMax("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.delete("min");
    params.delete("max");
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div className="relative w-[30%] md:w-[20%]">
      <Button
        type="button"
        onClick={toggleOpen}
        className="h-9 w-full border border-input bg-black px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#D97A7A] hover:text-white"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filter
        {activeCount > 0 && (
          <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FED6D6] px-1 text-[10px] font-bold text-black">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-black p-3 shadow-md md:left-1/2 md:-translate-x-1/2"
            style={{ backgroundColor: "#F6F1E7" }}
          >
            <p className="mb-2 text-sm font-semibold">Status Stok</p>
            <div className="flex flex-row gap-4 text-sm">
              {BOOK_STATUSES.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-1.5"
                >
                  <input
                    type="checkbox"
                    checked={status.includes(opt.value)}
                    onChange={() => toggleStatus(opt.value)}
                    className="h-4 w-4 accent-[#D97A7A]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            <div className="my-3 h-px w-full bg-black/15" />

            <p className="mb-1 text-sm font-semibold">Harga</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Min</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-2.5 z-10 flex items-center text-xs text-black/60">
                    Rp
                  </span>
                  <Input
                    inputMode="numeric"
                    value={min ? formatRp(min) : ""}
                    onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
                    onBlur={() =>
                      push(status, min.replace(/\D/g, ""), max.replace(/\D/g, ""))
                    }
                    placeholder="0"
                    className="h-9 pl-8 text-xs placeholder:text-black/30"
                  />
                </div>
              </div>
              <span className="mt-6 flex h-9 items-center text-muted-foreground">-</span>
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Max</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-2.5 z-10 flex items-center text-xs text-black/60">
                    Rp
                  </span>
                  <Input
                    inputMode="numeric"
                    value={max ? formatRp(max) : ""}
                    onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
                    onBlur={() =>
                      push(status, min.replace(/\D/g, ""), max.replace(/\D/g, ""))
                    }
                    placeholder="0"
                    className="h-9 pl-8 text-xs placeholder:text-black/30"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 h-px w-full bg-black/15" />

            <Button
                type="button"
                onClick={reset}
                className="mt-3 h-9 w-full border border-input bg-black px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#D97A7A] hover:text-white"
              >
                Reset Filter
              </Button>
          </div>
        </>
      )}
    </div>
  );
}