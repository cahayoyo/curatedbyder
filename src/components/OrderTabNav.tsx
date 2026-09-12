"use client";

import { useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Loader2, Search, Wallet } from "lucide-react";
import { useBuyerNav } from "@/components/BuyerShell";

const TABS = [
  { value: "invoice", label: "Invoice", icon: FileText },
  { value: "payment", label: "Pembayaran", icon: Wallet },
  { value: "shipment", label: "Lacak", icon: Search },
] as const;

export function OrderTabNav({
  basePath,
  defaultTab,
}: {
  basePath: string;
  defaultTab: string;
}) {
  const { active: pending, navigate } = useBuyerNav("tabs");
  const searchParams = useSearchParams();
  const lastRequested = useRef<string | null>(null);

  function selectTab(v: string) {
    if (v === defaultTab || v === lastRequested.current) return;
    lastRequested.current = v;
    const params = new URLSearchParams(searchParams.toString());
    if (v === "invoice") params.delete("tab");
    else params.set("tab", v);
    navigate(`${basePath}?${params.toString()}`);
  }

  const tabCls =
    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-black/60 transition-colors data-[active=true]:bg-[#FBE6E6] data-[active=true]:text-[#C0474A]";

  return (
    <div className="flex w-full gap-1 overflow-hidden rounded-xl border border-[#F0CBCB] bg-[#FDF1F1] p-1">
      {TABS.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => selectTab(t.value)}
            data-active={t.value === defaultTab}
            aria-current={t.value === defaultTab ? "page" : undefined}
            className={tabCls}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
