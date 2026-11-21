"use client";

import type { ReactNode } from "react";
import { Check, PackageX, Truck } from "lucide-react";
import { STATUS_LABEL, TRACKING_STAGES } from "@/lib/orderOptions";
import {
  aggregateStamp,
  allOutOfStock,
  currentStageIndex,
  hasOutOfStock,
  stageDateParts,
  type TimelineItem,
} from "@/lib/tracking";

export function StageTimeline({ items }: { items: TimelineItem[] }) {
  if (allOutOfStock(items)) return null;
  const done = currentStageIndex(items);
  const isFinal = done === TRACKING_STAGES.length - 1;

  return (
    <div className="overflow-x-auto pb-1">
      <div className="grid min-w-[420px] grid-cols-3 items-start">
        {TRACKING_STAGES.map((stage, i) => {
          const reached = i <= done;
          const isCurrent = i === done && !isFinal;
          const stamp = aggregateStamp(items, i);
          const parts = stamp ? stageDateParts(stamp) : null;
          const halfColor = (j: number) =>
            isFinal || j < done
              ? "bg-emerald-400"
              : j === done
                ? "bg-[#D97A7A]/60"
                : "bg-transparent";
          return (
            <div
              key={stage.value}
              className="relative flex flex-col items-center gap-1 px-0.5 text-center"
            >
              {i < TRACKING_STAGES.length - 1 && (
                <>
                  <span
                    aria-hidden
                    className={`absolute left-1/2 top-[13px] z-0 h-0.5 w-1/2 ${halfColor(i)}`}
                  />
                  <span
                    aria-hidden
                    className={`absolute left-full top-[13px] z-0 h-0.5 w-1/2 ${halfColor(i + 1)}`}
                  />
                </>
              )}
              <span
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full ${
                  isCurrent
                    ? "bg-[#D97A7A] text-white ring-4 ring-[#FBE6E6]"
                    : reached
                      ? "bg-emerald-500 text-white"
                      : "border border-black/10 bg-white text-black/30"
                }`}
              >
                {reached && !isCurrent ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Truck className="h-3.5 w-3.5" />
                )}
              </span>
              <span
                className={`text-[11px] font-medium leading-tight ${reached ? "text-black/80" : "text-black/40"}`}
              >
                {STATUS_LABEL[stage.value] ?? stage.label}
              </span>
              {parts ? (
                <>
                  <span className="text-[10px] leading-tight text-black/50">{parts.date}</span>
                  <span className="text-[10px] leading-tight text-black/40">{parts.time}</span>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StageTimelineVertical({
  items,
  currentExtra,
}: {
  items: TimelineItem[];
  currentExtra?: ReactNode;
}) {
  if (allOutOfStock(items)) return <>{currentExtra}</>;
  const done = currentStageIndex(items);
  const isFinal = done === TRACKING_STAGES.length - 1;
  const segment = (j: number) =>
    isFinal || j < done ? "bg-emerald-400" : j === done ? "bg-[#D97A7A]/60" : "bg-black/10";

  return (
    <div>
      {TRACKING_STAGES.map((stage, i) => {
        const reached = i <= done;
        const isCurrent = i === done && !isFinal;
        const stamp = aggregateStamp(items, i);
        const parts = stamp ? stageDateParts(stamp) : null;
        const isLast = i === TRACKING_STAGES.length - 1;
        return (
          <div key={stage.value}>
            <div className="flex gap-3">
              <div className="flex w-7 shrink-0 flex-col items-center">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    isCurrent
                      ? "bg-[#D97A7A] text-white ring-4 ring-[#FBE6E6]"
                      : reached
                        ? "bg-emerald-500 text-white"
                        : "border border-black/10 bg-white text-black/30"
                  }`}
                >
                  {reached && !isCurrent ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Truck className="h-3.5 w-3.5" />
                  )}
                </span>
                {!isLast && <span className={`w-0.5 flex-1 ${segment(i)}`} />}
              </div>
              <div className={`min-w-0 flex-1 ${isLast ? "" : "min-h-[52px] pb-4"}`}>
                <p className={`text-xs font-semibold ${reached ? "text-black/80" : "text-black/40"}`}>
                  {STATUS_LABEL[stage.value] ?? stage.label}
                </p>
                {parts && (
                  <p className="text-[11px] text-black/50">
                    {parts.date}, {parts.time}
                  </p>
                )}
              </div>
            </div>

            {isCurrent && currentExtra && (
              <div className="flex gap-3">
                <div className="flex w-7 shrink-0 flex-col items-center">
                  <span className={`w-0.5 flex-1 ${segment(done)}`} />
                  <span className="w-0.5 flex-1 bg-black/10" />
                </div>
                <div className="min-w-0 flex-1 pb-4">{currentExtra}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const STAGE_INFO: Record<string, { title: string; description: string }> = {
  ORDER_PLACED: {
    title: "Pesanan sudah dibuat",
    description: "Pesanan kamu sudah kami terima dan sedang kami proses.",
  },
  ARRIVED_AT_WAREHOUSE: {
    title: "Paket sudah tiba di warehouse",
    description: "Paket kamu sudah tiba di gudang kami dan sedang dalam proses sortir.",
  },
  SHIPPED_TO_CUSTOMER: {
    title: "Paket sudah dikirim ke alamatmu",
    description: "Pesanan kamu sudah dikirim ke alamat tujuan. Ini adalah tahap akhir pengiriman.",
  },
  OUT_OF_STOCK: {
    title: "Item sedang out of stock",
    description: "Item pada pesanan ini tidak dapat dipenuhi karena stok sedang habis.",
  },
};

export function StageStatusBanner({
  items,
  action,
}: {
  items: TimelineItem[];
  action?: ReactNode;
}) {
  const allOos = allOutOfStock(items);
  const idx = currentStageIndex(items);
  const stage = TRACKING_STAGES[idx];
  const info = STAGE_INFO[allOos ? "OUT_OF_STOCK" : stage.value];
  if (!info) return null;
  const mixedOos = !allOos && hasOutOfStock(items);

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${
        allOos ? "border-red-200 bg-red-50" : "border-[#F0CBCB]/60 bg-[#FBE6E6]/70"
      }`}
    >
      <div className="flex gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
            allOos ? "bg-red-500" : "bg-[#D97A7A]"
          }`}
        >
          {allOos ? <PackageX className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
        </span>
        <div>
          <p className={`text-sm font-semibold ${allOos ? "text-red-700" : "text-[#B04A4A]"}`}>
            {info.title}
          </p>
          <p className="mt-0.5 text-xs text-black/60">{info.description}</p>
          {mixedOos && (
            <p className="mt-1 text-xs font-semibold text-red-600">
              Ada item yang out of stock pada pesanan ini.
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">{action}</div>}
    </div>
  );
}
