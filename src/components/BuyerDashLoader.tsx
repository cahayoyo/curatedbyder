"use client";

import { Loader2 } from "lucide-react";

export function BuyerDashLoader({ label = "Memuat..." }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-black/10 py-10"
      style={{ backgroundColor: "#F6F1E7" }}
    >
      <Loader2 className="h-6 w-6 animate-spin text-[#D97A7A]" />
      <p className="text-sm text-black/60">{label}</p>
    </div>
  );
}