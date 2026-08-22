import { Badge } from "@/components/ui/badge";

const FORMAT_COLORS = [
  "border-blue-300 bg-blue-100 text-blue-800",
  "border-purple-300 bg-purple-100 text-purple-800",
  "border-pink-300 bg-pink-100 text-pink-800",
  "border-teal-300 bg-teal-100 text-teal-800",
  "border-orange-300 bg-orange-100 text-orange-800",
];

export function FormatBadge({ value, index }: { value: string; index: number }) {
  return (
    <Badge
      variant="outline"
      className={`${FORMAT_COLORS[index % FORMAT_COLORS.length]} text-[11px]`}
    >
      {value}
    </Badge>
  );
}