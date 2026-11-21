export const ITEM_STATUSES = [
  { value: "ORDER_PLACED", label: "Order Placed" },
  { value: "ARRIVED_AT_WAREHOUSE", label: "Arrived at Warehouse" },
  { value: "SHIPPED_TO_CUSTOMER", label: "Shipped to Customer" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
] as const;

export const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  ITEM_STATUSES.map((s) => [s.value, s.label])
);

// Linear tracking stages. OUT_OF_STOCK is an exception status, not a stage.
export const TRACKING_STAGES = [
  { value: "ORDER_PLACED", field: "placedAt", label: "Order Placed" },
  { value: "ARRIVED_AT_WAREHOUSE", field: "arrivedAtWarehouseAt", label: "Arrived at Warehouse" },
  { value: "SHIPPED_TO_CUSTOMER", field: "shippedToCustomerAt", label: "Shipped to Customer" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "NO_PAYMENT", label: "Unpaid" },
  { value: "DONE_DP", label: "Deposit Paid" },
  { value: "LUNAS", label: "Fully Paid" },
  { value: "REFUNDED", label: "Refunded" },
] as const;

export const PAYMENT_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_STATUSES.map((p) => [p.value, p.label])
);

export const PAYMENT_BADGE: Record<string, string> = {
  NO_PAYMENT: "border-red-300 bg-red-100 text-red-800",
  DONE_DP: "border-amber-300 bg-amber-100 text-amber-800",
  LUNAS: "border-emerald-300 bg-emerald-100 text-emerald-800",
  REFUNDED: "border-violet-300 bg-violet-100 text-violet-800",
};

export const STATUS_BADGE: Record<string, string> = {
  ORDER_PLACED: "border-teal-300 bg-teal-100 text-teal-800",
  ARRIVED_AT_WAREHOUSE: "border-violet-300 bg-violet-100 text-violet-800",
  SHIPPED_TO_CUSTOMER: "border-orange-300 bg-orange-100 text-orange-800",
  OUT_OF_STOCK: "border-red-300 bg-red-100 text-red-800",
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
  "ARRIVED_AT_WAREHOUSE",
  "SHIPPED_TO_CUSTOMER",
  "OUT_OF_STOCK",
] as const;
export const ETA_TYPE = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;
export const PAYMENT_TYPE = ["NO_PAYMENT", "LUNAS", "DONE_DP", "REFUNDED"] as const;
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

export const MONTH_LABELS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export const FORMATS = [
  { value: "HC", label: "HC" },
  { value: "PB", label: "PB" },
  { value: "BB", label: "BB" },
  { value: "SET", label: "SET" },
  { value: "SB", label: "SB" },
] as const;