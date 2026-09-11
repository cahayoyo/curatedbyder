"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIDR } from "@/lib/format";

const FIXED_COST = 5 * 4400;
const SERVICE_FEE = 15000;
const MYR_TO_IDR = 4200;
const SHIPPING_PER_10KG = 25000;

function toNumber(value: string) {
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function BookxcessCalculator() {
  const [priceMyr, setPriceMyr] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const total =
    FIXED_COST +
    SERVICE_FEE +
    toNumber(priceMyr) * MYR_TO_IDR +
    (toNumber(weightKg) / 10) * SHIPPING_PER_10KG;

  function sanitize(value: string) {
    return value.replace(/[^\d.,]/g, "");
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-rose-100 bg-[#FDF1F1] p-5 shadow-lg shadow-rose-200/40 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBE6E6] text-[#C96A6A]">
          <Calculator className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-bold leading-tight text-gray-900 sm:text-lg">
            Estimasi Perhitungan Buku Web Bookxcess
          </h2>
          <p className="text-xs text-gray-500">
            Masukkan harga dan berat buku, estimasi muncul otomatis.
          </p>
        </div>
      </div>

      <div className="space-y-3">
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
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
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
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
              KG
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#F0CBCB]/60 bg-gradient-to-br from-white via-[#F9E4E4] to-[#F3CFCF] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B85C5C]/80">
          Estimasi Total Bayar
        </p>
        <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-[#B85C5C]">
          {formatIDR(total)}
        </p>
      </div>
    </div>
  );
}
