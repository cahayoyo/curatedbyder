export const STATUSES = [
  { value: "ORDER_PLACED", label: "Order Placed" },
  { value: "SHIPPING_TO_INDONESIA", label: "Shipping to Indonesia" },
  { value: "ARRIVED_IN_INDONESIA", label: "Arrived in Indonesia" },
  { value: "ARRIVED_AT_WAREHOUSE", label: "Arrived at Warehouse" },
  { value: "SHIPPED_TO_CUSTOMER", label: "Shipped to Customer" },
  { value: "ORDER_DELIVERED", label: "Order Delivered" },
] as const;

export const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s.label])
);

export const PAYMENT_STATUSES = [
  { value: "NO_PAYMENT", label: "Unpaid" },
  { value: "DONE_DP", label: "Deposit Paid" },
  { value: "LUNAS", label: "Fully Paid" },
] as const;

export const PAYMENT_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_STATUSES.map((p) => [p.value, p.label])
);

export const PAYMENT_BADGE: Record<string, string> = {
  NO_PAYMENT: "border-red-300 bg-red-100 text-red-800",
  DONE_DP: "border-amber-300 bg-amber-100 text-amber-800",
  LUNAS: "border-emerald-300 bg-emerald-100 text-emerald-800",
};

export const STATUS_BADGE: Record<string, string> = {
  ORDER_PLACED: "border-teal-300 bg-teal-100 text-teal-800",
  SHIPPING_TO_INDONESIA: "border-sky-300 bg-sky-100 text-sky-800",
  ARRIVED_IN_INDONESIA: "border-indigo-300 bg-indigo-100 text-indigo-800",
  ARRIVED_AT_WAREHOUSE: "border-violet-300 bg-violet-100 text-violet-800",
  SHIPPED_TO_CUSTOMER: "border-orange-300 bg-orange-100 text-orange-800",
  ORDER_DELIVERED: "border-emerald-300 bg-emerald-100 text-emerald-800",
};

export const FORMAT_BADGE: Record<string, string> = {
  HC: "border-sky-300 bg-sky-100 text-sky-800",
  PB: "border-violet-300 bg-violet-100 text-violet-800",
  BB: "border-amber-300 bg-amber-100 text-amber-800",
  SET: "border-emerald-300 bg-emerald-100 text-emerald-800",
  SB: "border-rose-300 bg-rose-100 text-rose-800",
};

export const BOOK_STATUSES = [
  { value: "READY_STOCK", label: "Ready Stok" },
  { value: "PRE_ORDER", label: "Pre Order" },
] as const;

export function etaLabel(v: string | null | undefined) {
  if (v == null) return "—";
  return ETAS.find((e) => e.value === v)?.label ?? v;
}

export const STATUS_TYPE = [
  "ORDER_PLACED",
  "SHIPPING_TO_INDONESIA",
  "ARRIVED_IN_INDONESIA",
  "ARRIVED_AT_WAREHOUSE",
  "SHIPPED_TO_CUSTOMER",
  "ORDER_DELIVERED",
] as const;
export const ETA_TYPE = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;
export const PAYMENT_TYPE = ["NO_PAYMENT", "LUNAS", "DONE_DP"] as const;
export const FORMAT_TYPE = ["HC", "PB", "BB", "SET", "SB"] as const;
export const BOOK_STATUS_TYPE = ["READY_STOCK", "PRE_ORDER"] as const;

export const ETAS = [
  { value: "JAN", label: "Januari" },
  { value: "FEB", label: "Februari" },
  { value: "MAR", label: "Maret" },
  { value: "APR", label: "April" },
  { value: "MAY", label: "Mei" },
  { value: "JUN", label: "Juni" },
  { value: "JUL", label: "Juli" },
  { value: "AUG", label: "Agustus" },
  { value: "SEP", label: "September" },
  { value: "OCT", label: "Oktober" },
  { value: "NOV", label: "November" },
  { value: "DEC", label: "Desember" },
] as const;

export const FORMATS = [
  { value: "HC", label: "HC" },
  { value: "PB", label: "PB" },
  { value: "BB", label: "BB" },
  { value: "SET", label: "SET" },
  { value: "SB", label: "SB" },
] as const;