"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CalendarClock,
  ChevronDown,
  Coins,
  FileText,
  Layers,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";

type GroupTotalEntry = {
  value: string;
  label: string;
  count: number;
  total: number;
};

export type OrderSummaryDTO = {
  totalOrders: number;
  grandTotal: number;
  byBatch: GroupTotalEntry[];
  byEta: GroupTotalEntry[];
  byPayment: GroupTotalEntry[];
  byStatus: GroupTotalEntry[];
};

function Stat({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {title}
      </p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function GroupSection({
  title,
  icon,
  placeholder,
  options,
}: {
  title: string;
  icon: React.ReactNode;
  placeholder: string;
  options: GroupTotalEntry[];
}) {
  const [selected, setSelected] = useState(options[0]?.value ?? "");
  const current = options.find((o) => o.value === selected);

  return (
    <div className="rounded-lg border p-3">
      <Label className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {title}
      </Label>
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="mt-2">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {current ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-black/5 p-2">
            <p className="text-xs text-muted-foreground">Jumlah Order</p>
            <p className="font-bold">{current.count}</p>
          </div>
          <div className="rounded-md bg-black/5 p-2">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-bold">{formatIDR(current.total)}</p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}

export function OrderSummaryAccordion(data: OrderSummaryDTO) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-semibold transition-colors hover:bg-black/5"
      >
        <span className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#D97A7A]" />
          Ringkasan Pesanan
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t p-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              icon={<FileText className="h-4 w-4" />}
              title="Total Order"
              value={String(data.totalOrders)}
            />
            <Stat
              icon={<Coins className="h-4 w-4" />}
              title="Total Pendapatan"
              value={formatIDR(data.grandTotal)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <GroupSection
              title="Total Order by Batch"
              icon={<Layers className="h-3.5 w-3.5" />}
              placeholder="Pilih batch"
              options={data.byBatch}
            />
            <GroupSection
              title="Total Order by ETA"
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              placeholder="Pilih ETA"
              options={data.byEta}
            />
            <GroupSection
              title="Total Order by Status Pembayaran"
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              placeholder="Pilih status pembayaran"
              options={data.byPayment}
            />
            <GroupSection
              title="Total Order by Status Pesanan"
              icon={<PackageCheck className="h-3.5 w-3.5" />}
              placeholder="Pilih status pesanan"
              options={data.byStatus}
            />
          </div>
        </div>
      )}
    </div>
  );
}