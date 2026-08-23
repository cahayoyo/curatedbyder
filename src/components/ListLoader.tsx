"use client";

import { Loader2 } from "lucide-react";

export function ListLoader({
  label = "Memuat...",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-black/10 ${
        compact ? "py-6" : "py-10"
      }`}
      style={{ backgroundColor: "#F6F1E7" }}
    >
      <Loader2 className="h-6 w-6 animate-spin text-[#D97A7A]" />
      <p className="text-sm text-black/60">{label}</p>
    </div>
  );
}