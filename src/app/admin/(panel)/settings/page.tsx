import { Settings } from "lucide-react";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/store-settings";
import { CatalogVisibilityList, StoreSettingsForm } from "@/components/StoreSettingsForm";

export default async function AdminSettingsPage() {
  const [settings, books, toys] = await Promise.all([
    getStoreSettings(),
    db.book.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, showOnDashboard: true },
    }),
    db.toy.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, showOnDashboard: true },
    }),
  ]);

  return (
    <div className="space-y-4 px-2 md:px-6 [--border:0_55%_87%] [--input:0_55%_87%]">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Settings className="h-6 w-6 text-[#D97A7A]" />
          Pengaturan
        </h2>
        <p className="text-sm text-muted-foreground">
          Atur nilai kalkulator Bookxcess dan produk yang tampil di dashboard pembeli.
        </p>
      </div>

      <StoreSettingsForm settings={settings} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CatalogVisibilityList kind="book" items={books} />
        <CatalogVisibilityList kind="toy" items={toys} />
      </div>
    </div>
  );
}
