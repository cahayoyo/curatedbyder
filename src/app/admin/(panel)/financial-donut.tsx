"use client";

import { formatIDR } from "@/lib/format";
import { useRangePending } from "./range-provider";

export const FIN_COLORS = {
  revenue: "#7FC49A",
  dp: "#7FB5E6",
  remaining: "#F6D88C",
};

export function FinancialDonut({
  revenue,
  dp,
  remaining,
}: {
  revenue: number;
  dp: number;
  remaining: number;
}) {
  const pending = useRangePending();
  const R = 78;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segs = [
    { value: dp, color: FIN_COLORS.dp },
    { value: remaining, color: FIN_COLORS.remaining },
  ]
    .filter((p) => revenue > 0 && p.value > 0)
    .map((p) => {
      const len = (p.value / revenue) * C;
      const seg = { ...p, len, start: acc };
      acc += len;
      return seg;
    });
  return (
    <svg viewBox="0 0 200 200" className="h-52 w-52 shrink-0 lg:h-64 lg:w-64">
      <circle cx="100" cy="100" r={R} fill="none" stroke="#F6E8E8" strokeWidth="40" />
      {segs.map((s) => (
        <circle
          key={s.color}
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke={s.color}
          strokeWidth="40"
          strokeDasharray={`${s.len} ${C - s.len}`}
          strokeDashoffset={-s.start}
          transform="rotate(-90 100 100)"
        />
      ))}
      {segs.map((s) => {
        const mid = ((s.start + s.len / 2) / C) * 2 * Math.PI - Math.PI / 2;
        return (
          <text
            key={s.color}
            x={100 + R * Math.cos(mid)}
            y={100 + R * Math.sin(mid)}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-gray-900 text-xs font-bold"
          >
            {Math.round((s.value / revenue) * 100)}%
          </text>
        );
      })}
      {pending ? (
        <>
          <rect
            x="30"
            y="82"
            width="140"
            height="18"
            rx="9"
            className="animate-pulse fill-[#F0CBCB]"
          />
          <rect
            x="55"
            y="108"
            width="90"
            height="11"
            rx="5"
            className="animate-pulse fill-[#F0CBCB]"
          />
        </>
      ) : (
        <>
          <text
            x="100"
            y="92"
            textAnchor="middle"
            className="fill-gray-900 text-lg font-bold"
          >
            {formatIDR(revenue)}
          </text>
          <text x="100" y="113" textAnchor="middle" className="fill-gray-500 text-[11px]">
            Total Transaksi
          </text>
        </>
      )}
    </svg>
  );
}
