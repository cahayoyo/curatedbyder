import { requireRole } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { BuyerForm } from "@/components/BuyerForm";

export default async function NewBuyerPage() {
  await requireRole("SUPER_ADMIN");
  return (
    <div className="space-y-4 px-2 md:px-6 [--border:0_55%_87%] [--input:0_55%_87%]">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/admin/buyers" className="transition-colors hover:text-black">
          Pembeli
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-black">Tambah Pembeli</span>
      </nav>

      <div className="flex items-start gap-3">
        <Link
          href="/admin/buyers"
          aria-label="Kembali"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F0CBCB] bg-white text-[#C96A6A] transition-colors hover:bg-[#FED6D6]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Tambah Pembeli</h2>
          <p className="text-base text-muted-foreground">
            Tambahkan pembeli baru ke sistem CuratedByDer.
          </p>
        </div>
      </div>

      <BuyerForm />
    </div>
  );
}
