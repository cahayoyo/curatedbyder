export function normalizePhone(phone: string): string {
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "62" + p.slice(1);
  return p;
}

export function waLink(phone: string, text?: string): string | null {
  const p = normalizePhone(phone);
  if (!p) return null;
  const base = `https://wa.me/${p}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}