export const SOURCES = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "SHOPEE", label: "Shopee" },
  { value: "OTHER", label: "Other" },
] as const;

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
  { value: "NO_PAYMENT", label: "No Payment" },
  { value: "LUNAS", label: "Lunas" },
  { value: "DONE_DP", label: "Done DP" },
] as const;

export const PAYMENT_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_STATUSES.map((p) => [p.value, p.label])
);

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
  { value: "BS", label: "BS" },
  { value: "SB", label: "SB" },
] as const;

export const BATCHES = [
  { value: "BATCH1", label: "Batch 1" },
  { value: "BATCH2", label: "Batch 2" },
] as const;