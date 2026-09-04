import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function NavMenuFallback() {
  return (
    <Button
      variant="outline"
      style={{ backgroundColor: "#D97A7A", color: "#ffffff" }}
      className="h-10 items-center gap-1.5 border border-input px-2 py-1 text-sm"
    >
      <Menu className="h-4 w-4" />
      Menu
    </Button>
  );
}
