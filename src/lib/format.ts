const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatIDR(value: number | null | undefined) {
  if (value == null) return "—";
  return idr.format(value);
}

export function formatRp(digits: string): string {
  const clean = digits.replace(/\D/g, "");
  if (!clean) return "";
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function dateLabel(v: Date | string) {
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}