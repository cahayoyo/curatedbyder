"use client";

import { useState } from "react";
import { Calculator, Check, Copy, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIDR } from "@/lib/format";
import type { StoreSettings } from "@/lib/store-settings";

function toNumber(value: string) {
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function BookxcessCalculator({ settings }: { settings: StoreSettings }) {
  const { fixedCost, serviceFee, myrToIdr, shippingPerKg } = settings;
  const [priceMyr, setPriceMyr] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [copied, setCopied] = useState(false);

  const hasInput = priceMyr.trim() !== "" || weightKg.trim() !== "";

  const total = hasInput
    ? fixedCost +
      serviceFee +
      toNumber(priceMyr) * myrToIdr +
      toNumber(weightKg) * shippingPerKg
    : 0;

  function sanitize(value: string) {
    return value.replace(/[^\d.,]/g, "");
  }

  async function copyTotal() {
    try {
      await navigator.clipboard.writeText(formatIDR(total));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ponytail: clipboard permission denied — no-op, user can select manually
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-rose-100 bg-[#FDF1F1] p-5 shadow-lg shadow-rose-200/40 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F6CFCF] via-[#E8B4B4] to-[#F6CFCF]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-[#F6CFCF]/70 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-14 h-44 w-44 rounded-full bg-[#FBE6E6] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-5 bottom-1 h-3 bg-[radial-gradient(#E8B4B4_1.5px,transparent_1.5px)] [background-size:10px_10px] opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 right-1/3 h-24 w-24 rotate-12 rounded-3xl bg-[#FBE6E6]/70 blur-xl"
      />
      <Sparkles
        aria-hidden
        className="pointer-events-none absolute right-5 top-4 h-4 w-4 text-[#E8B4B4]/90"
      />
      <Sparkles
        aria-hidden
        className="pointer-events-none absolute bottom-4 left-5 h-3 w-3 text-[#E8B4B4]/80"
      />

      <div className="relative">
        <div className="mb-4">
          <h2 className="text-base font-bold leading-tight text-gray-900 sm:text-lg">
            Estimasi Perhitungan Buku Web Bookxcess
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBE6E6] text-[#C96A6A]">
              <Calculator className="h-5 w-5" />
            </span>
            <p className="text-xs text-gray-500">
              Masukkan harga dan berat buku untuk mengetahui estimasi harga.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="calc-myr" className="text-xs font-semibold text-gray-700">
              Harga Buku (MYR)
            </Label>
            <div className="relative">
              <Input
                id="calc-myr"
                inputMode="decimal"
                value={priceMyr}
                onChange={(e) => setPriceMyr(sanitize(e.target.value))}
                placeholder="Contoh: 8"
                className="rounded-lg border-rose-200 bg-white pr-12 placeholder:text-[#c9c9c9] focus-visible:ring-[#E8B4B4]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                MYR
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="calc-kg" className="text-xs font-semibold text-gray-700">
              Berat Buku (KG)
            </Label>
            <div className="relative">
              <Input
                id="calc-kg"
                inputMode="decimal"
                value={weightKg}
                onChange={(e) => setWeightKg(sanitize(e.target.value))}
                placeholder="Contoh: 4"
                className="rounded-lg border-rose-200 bg-white pr-12 placeholder:text-[#c9c9c9] focus-visible:ring-[#E8B4B4]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                KG
              </span>
            </div>
          </div>
        </div>

        <div className="relative mt-4 rounded-xl border border-[#F0CBCB]/60 bg-gradient-to-br from-white via-[#F9E4E4] to-[#F3CFCF] px-4 py-3 text-center">
          <button
            type="button"
            onClick={copyTotal}
            aria-label="Salin estimasi total"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-[#B85C5C]/70 transition-colors hover:bg-white/70 hover:text-[#B85C5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B4B4]"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B85C5C]/80">
            Estimasi Total Bayar
          </p>
          <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-[#B85C5C]">
            {formatIDR(total)}
          </p>
        </div>
      </div>
    </div>
  );
}
