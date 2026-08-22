export function generateUsername(name: string, phone: string): string {
  const firstName = (name || "").trim().split(/\s+/)[0].toLowerCase() ?? "";
  const last4 = (phone || "").replace(/\D/g, "").slice(-4);
  return `${firstName}${last4}`;
}