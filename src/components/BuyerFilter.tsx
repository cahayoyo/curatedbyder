"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { STATUSES, PAYMENT_STATUSES } from "@/lib/orderOptions";
import { useBuyerNav } from "@/components/BuyerShell";

type Batch = { id: string; name: string };

export function BuyerFilter({
  basePath,
  batches,
}: {
  basePath: string;
  batches: Batch[];
}) {
  const { pending, navigate } = useBuyerNav();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [batch, setBatch] = useState("");

  const urlList = (key: string) =>
    searchParams.get(key)?.split(",").filter(Boolean) ?? [];

  const activeCount =
    urlList("paymentStatus").length +
    (searchParams.get("status") ? 1 : 0) +
    (searchParams.get("batch") ? 1 : 0);

  function toggleOpen() {
    const next = !open;
    if (next) {
      setPaymentStatus(urlList("paymentStatus"));
      setStatus(searchParams.get("status") ?? "");
      setBatch(searchParams.get("batch") ?? "");
    }
    setOpen(next);
  }

  function pushParams(params: URLSearchParams) {
    params.delete("page");
    navigate(`${basePath}?${params.toString()}`);
  }

  function togglePayment(v: string) {
    const next = paymentStatus.includes(v)
      ? paymentStatus.filter((x) => x !== v)
      : [...paymentStatus, v];
    setPaymentStatus(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set("paymentStatus", next.join(","));
    else params.delete("paymentStatus");
    pushParams(params);
  }

  function pushSingle(key: "status" | "batch", next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(key, next);
    else params.delete(key);
    pushParams(params);
  }

  function reset() {
    setPaymentStatus([]);
    setStatus("");
    setBatch("");
    const params = new URLSearchParams(searchParams.toString());
    ["paymentStatus", "status", "batch"].forEach((k) => params.delete(k));
    pushParams(params);
    setOpen(false);
  }

  return (
    <div className="relative w-[30%] md:w-[20%]">
      <Button
        type="button"
        onClick={toggleOpen}
        disabled={pending}
        className="h-9 w-full border border-input bg-black px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#D97A7A] hover:text-white"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
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
            className="absolute left-0 top-full z-50 mt-1 max-h-[70vh] w-80 overflow-y-auto rounded-lg border border-black p-3 shadow-md md:left-1/2 md:w-96 md:-translate-x-1/2"
            style={{ backgroundColor: "#F6F1E7" }}
          >
            <p className="mb-2 text-sm font-semibold">Status Pembayaran</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {PAYMENT_STATUSES.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={paymentStatus.includes(opt.value)}
                    onChange={() => togglePayment(opt.value)}
                    disabled={pending}
                    className="h-4 w-4 accent-[#D97A7A]"
                  />
                  {opt.label}
                </label>
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
              disabled={pending}
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
              disabled={pending}
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

            <Button
              type="button"
              onClick={reset}
              disabled={pending}
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