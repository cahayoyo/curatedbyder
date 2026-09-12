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

// Compact forms used by the invoice list (e.g. "4 Sep 2026" / "10:24").
export function dateShortLabel(v: Date | string) {
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeShortLabel(v: Date | string) {
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}