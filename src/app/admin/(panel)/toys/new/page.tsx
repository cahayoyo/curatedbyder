import { requireRole } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getBatches } from "@/server/queries/catalog";
import { ToyForm } from "@/components/ToyForm";

export default async function NewToyPage() {
  await requireRole("SUPER_ADMIN");
  const batches = await getBatches();

  return (
    <div className="space-y-4 px-2 md:px-6 [--border:0_55%_87%] [--input:0_55%_87%]">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/admin/toys" className="transition-colors hover:text-black">
          Mainan
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-black">Tambah Mainan</span>
      </nav>

      <div className="flex items-start gap-3">
        <Link
          href="/admin/toys"
          aria-label="Kembali"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F0CBCB] bg-white text-[#C96A6A] transition-colors hover:bg-[#FED6D6]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Tambah Mainan</h2>
          <p className="text-base text-muted-foreground">
            Tambahkan mainan baru ke koleksi CuratedByDer.
          </p>
        </div>
      </div>

      <ToyForm batches={batches.map((b) => ({ id: b.id, name: b.name }))} />
    </div>
  );
}
