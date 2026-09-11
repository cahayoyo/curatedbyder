import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getBatches } from "@/server/queries/catalog";
import { BookForm } from "@/components/BookForm";

export default async function NewBookPage() {
  const batches = await getBatches();

  return (
    <div className="space-y-4 px-2 md:px-6 [--border:0_55%_87%] [--input:0_55%_87%]">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/admin/books" className="transition-colors hover:text-black">
          Buku
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-black">Tambah Buku</span>
      </nav>

      <div className="flex items-start gap-3">
        <Link
          href="/admin/books"
          aria-label="Kembali"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F0CBCB] bg-white text-[#C96A6A] transition-colors hover:bg-[#FED6D6]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Tambah Buku</h2>
          <p className="text-sm text-muted-foreground">
            Tambahkan buku baru ke koleksi CuratedByDer.
          </p>
        </div>
      </div>

      <BookForm batches={batches.map((b) => ({ id: b.id, name: b.name }))} />
    </div>
  );
}
