export const AVATAR_COLORS = [
  "bg-[#FED6D6] text-[#C96A6A]",
  "bg-[#D6EBFD] text-[#3B82C4]",
  "bg-[#E6DBFB] text-[#7C4DC4]",
  "bg-[#D6F5E3] text-[#2E9E63]",
  "bg-[#FCEDC4] text-[#C08A1F]",
];

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? parts[1][0] ?? "" : "";
  return (first + second).toUpperCase() || "?";
}

export function avatarClass(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
