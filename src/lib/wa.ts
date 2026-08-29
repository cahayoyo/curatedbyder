function normalizePhone(phone: string): string {
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "62" + p.slice(1);
  return p;
}

export function waLink(phone: string, text?: string): string | null {
  const p = normalizePhone(phone);
  if (!p) return null;
  // Do not use wa.me here: its redirect re-encodes ?text= as Latin-1 and turns
  // every character outside that range (emoji, ✅, …) into U+FFFD "�" (#91).
  // api.whatsapp.com/send passes the UTF-8 payload through untouched.
  const base = `https://api.whatsapp.com/send?phone=${p}`;
  return text ? `${base}&text=${encodeURIComponent(text)}` : base;
}