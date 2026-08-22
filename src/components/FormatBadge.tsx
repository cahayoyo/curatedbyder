import { Badge } from "@/components/ui/badge";

const FORMAT_COLORS: Record<string, string> = {
  HC: "border-blue-300 bg-blue-100 text-blue-800",
  PB: "border-purple-300 bg-purple-100 text-purple-800",
  BB: "border-pink-300 bg-pink-100 text-pink-800",
  SET: "border-teal-300 bg-teal-100 text-teal-800",
  SB: "border-orange-300 bg-orange-100 text-orange-800",
};

const FALLBACK_COLOR =
  "border-slate-300 bg-slate-100 text-slate-700";

export function FormatBadge({ value }: { value: string }) {
  return (
    <Badge
      variant="outline"
      className={`${FORMAT_COLORS[value] ?? FALLBACK_COLOR} text-[11px]`}
    >
      {value}
    </Badge>
  );
}