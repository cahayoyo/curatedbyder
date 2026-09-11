import { requireRole } from "@/lib/session";
import { BookOpen } from "lucide-react";

export default async function CatalogPage() {
  await requireRole("USER");

  return (
    <div className="space-y-4 px-2 md:px-6">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <BookOpen className="h-6 w-6 text-[#D97A7A]" />
        Katalog
      </h2>
      <p className="text-muted-foreground">Katalog buku &amp; mainan segera hadir.</p>
    </div>
  );
}
