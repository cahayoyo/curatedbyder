const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatIDR(value: number | null | undefined) {
  if (value == null) return "—";
  return idr.format(value);
}