"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal } from "lucide-react";
import { STATUSES, PAYMENT_STATUSES, ETAS } from "@/lib/orderOptions";
import { cn } from "@/lib/utils";

type Batch = { id: string; name: string };

export function OrderFilter({
  basePath,
  batches,
  className,
}: {
  basePath: string;
  batches: Batch[];
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [batch, setBatch] = useState("");
  const [eta, setEta] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const urlList = (key: string) =>
    searchParams.get(key)?.split(",").filter(Boolean) ?? [];

  const activeCount =
    urlList("paymentStatus").length +
    (searchParams.get("status") ? 1 : 0) +
    (searchParams.get("batch") ? 1 : 0) +
    (searchParams.get("eta") ? 1 : 0) +
    (searchParams.get("dateFrom") ? 1 : 0) +
    (searchParams.get("dateTo") ? 1 : 0);

  function toggleOpen() {
    const next = !open;
    if (next) {
      setPaymentStatus(urlList("paymentStatus"));
      setStatus(searchParams.get("status") ?? "");
      setBatch(searchParams.get("batch") ?? "");
      setEta(searchParams.get("eta") ?? "");
      setDateFrom(searchParams.get("dateFrom") ?? "");
      setDateTo(searchParams.get("dateTo") ?? "");
    }
    setOpen(next);
  }

  function toggle(
    list: string[],
    set: (v: string[]) => void,
    v: string,
    key: "paymentStatus"
  ) {
    const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    set(next);
    pushList(key, next);
  }

  function pushList(key: "paymentStatus", next: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set(key, next.join(","));
    else params.delete(key);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  function pushSingle(key: "status" | "batch" | "eta", next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(key, next);
    else params.delete(key);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  function pushDate(key: "dateFrom" | "dateTo", next: string) {
    if (key === "dateFrom") setDateFrom(next);
    else setDateTo(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(key, next);
    else params.delete(key);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  function reset() {
    setPaymentStatus([]);
    setStatus("");
    setBatch("");
    setEta("");
    setDateFrom("");
    setDateTo("");
    const params = new URLSearchParams(searchParams.toString());
    ["paymentStatus", "status", "batch", "eta", "dateFrom", "dateTo"].forEach((k) =>
      params.delete(k)
    );
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
    setOpen(false);
  }

  function CheckRow({
    list,
    set,
    value,
    label,
    paramKey,
  }: {
    list: string[];
    set: (v: string[]) => void;
    value: string;
    label: string;
    paramKey: "paymentStatus";
  }) {
    return (
      <label className="flex cursor-pointer items-center gap-1.5">
        <input
          type="checkbox"
          checked={list.includes(value)}
          onChange={() => toggle(list, set, value, paramKey)}
          className="h-4 w-4 accent-[#D97A7A]"
        />
        {label}
      </label>
    );
  }

  return (
    <div className={cn("relative", className)}>
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
            className="absolute left-0 top-full z-50 mt-1 max-h-[70vh] w-80 overflow-y-auto rounded-lg border border-black p-3 shadow-md md:w-96"
            style={{ backgroundColor: "#F6F1E7" }}
          >
            <p className="mb-2 text-sm font-semibold">Status Pembayaran</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {PAYMENT_STATUSES.map((opt) => (
                <CheckRow
                  key={opt.value}
                  list={paymentStatus}
                  set={setPaymentStatus}
                  value={opt.value}
                  label={opt.label}
                  paramKey="paymentStatus"
                />
              ))}
            </div>

            <div className="my-3 h-px w-full bg-black/15" />

            <p className="mb-2 text-sm font-semibold">Status Pesanan</p>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                pushSingle("status", e.target.value);
              }}
              className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value="">Semua Status</option>
              {STATUSES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="my-3 h-px w-full bg-black/15" />

            <p className="mb-2 text-sm font-semibold">Batch</p>
            <select
              value={batch}
              onChange={(e) => {
                setBatch(e.target.value);
                pushSingle("batch", e.target.value);
              }}
              className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value="">Semua Batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <div className="my-3 h-px w-full bg-black/15" />

            <p className="mb-2 text-sm font-semibold">ETA</p>
            <select
              value={eta}
              onChange={(e) => {
                setEta(e.target.value);
                pushSingle("eta", e.target.value);
              }}
              className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value="">Semua ETA</option>
              {ETAS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="my-3 h-px w-full bg-black/15" />

            <p className="mb-2 text-sm font-semibold">Tanggal Order</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Dari</Label>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => pushDate("dateFrom", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-white px-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sampai</Label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => pushDate("dateTo", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-white px-2 text-sm"
                />
              </div>
            </div>
            {dateFrom && dateTo && dateFrom > dateTo && (
              <p className="mt-1 text-xs font-medium text-red-600">
                Tanggal &quot;Dari&quot; tidak boleh lebih baru dari tanggal &quot;Sampai&quot;.
              </p>
            )}

            <div className="my-3 h-px w-full bg-black/15" />

            <Button
              type="button"
              onClick={() => {
                reset();
              }}
              className="h-9 w-full border border-input bg-black px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#D97A7A] hover:text-white"
            >
              Reset Filter
            </Button>
          </div>
        </>
      )}
    </div>
  );
}