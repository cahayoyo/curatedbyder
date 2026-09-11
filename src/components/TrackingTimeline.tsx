"use client";

import { Check, Truck } from "lucide-react";
import { STATUS_LABEL, STATUS_TYPE } from "@/lib/orderOptions";
import {
  aggregateStamp,
  currentStageIndex,
  stageDateParts,
  stampLabel,
  type TimelineItem,
} from "@/lib/tracking";

export function StageTimeline({ items }: { items: TimelineItem[] }) {
  const done = currentStageIndex(items);
  const isDelivered = done === STATUS_TYPE.length - 1;

  return (
    <div className="overflow-x-auto pb-1">
      <div className="grid min-w-[760px] grid-cols-6 items-start">
        {STATUS_TYPE.map((sv, i) => {
          const reached = i <= done;
          const isCurrent = i === done && !isDelivered;
          const stamp = aggregateStamp(items, i);
          const parts = stamp ? stageDateParts(stamp) : null;
          const halfColor = (j: number) =>
            isDelivered || j < done
              ? "bg-emerald-400"
              : j === done
                ? "bg-[#D97A7A]/60"
                : "bg-transparent";
          return (
            <div key={sv} className="relative flex flex-col items-center gap-1 px-0.5 text-center">
              {i < STATUS_TYPE.length - 1 && (
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
                {reached && !isCurrent ? <Check className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
              </span>
              <span
                className={`text-[11px] font-medium leading-tight ${reached ? "text-black/80" : "text-black/40"}`}
              >
                {STATUS_LABEL[sv] ?? sv}
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

const STAGE_INFO: Record<string, { title: string; description: string }> = {
  ORDER_PLACED: {
    title: "Pesanan sudah dibuat",
    description: "Pesanan kamu sudah kami terima dan sedang kami proses.",
  },
  SHIPPING_TO_INDONESIA: {
    title: "Paket sedang dikirim ke Indonesia",
    description: "Paket kamu sedang dalam perjalanan menuju Indonesia.",
  },
  ARRIVED_IN_INDONESIA: {
    title: "Paket sudah tiba di Indonesia",
    description: "Paket kamu sudah tiba di Indonesia dan sedang menuju gudang kami.",
  },
  ARRIVED_AT_WAREHOUSE: {
    title: "Paket sudah tiba di warehouse",
    description: "Paket kamu sudah tiba di gudang kami dan sedang dalam proses sortir.",
  },
  SHIPPED_TO_CUSTOMER: {
    title: "Paket sedang dikirim ke alamatmu",
    description: "Paket kamu sedang dikirim oleh kurir ke alamat tujuan.",
  },
  ORDER_DELIVERED: {
    title: "Paket sudah diterima",
    description: "Paket kamu sudah diterima. Terima kasih sudah berbelanja!",
  },
};

export function StageStatusBanner({ items }: { items: TimelineItem[] }) {
  const idx = currentStageIndex(items);
  const info = STAGE_INFO[STATUS_TYPE[idx]];
  const stamp = aggregateStamp(items, idx);
  if (!info) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#F0CBCB]/60 bg-[#FBE6E6]/70 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="flex gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D97A7A] text-white">
          <Truck className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#B04A4A]">{info.title}</p>
          <p className="mt-0.5 text-xs text-black/60">{info.description}</p>
        </div>
      </div>
      {stamp && <p className="shrink-0 text-xs text-black/50 sm:text-right">{stampLabel(stamp)}</p>}
    </div>
  );
}
