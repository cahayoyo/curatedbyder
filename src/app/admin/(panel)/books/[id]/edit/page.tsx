import Link from "next/link";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { BookForm } from "@/components/BookForm";
import { getBatches } from "@/server/queries/catalog";

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [book, batches] = await Promise.all([
    db.book.findUnique({
      where: { id },
      include: { batchPrices: { select: { batchId: true, price: true, formats: true } } },
    }),
    getBatches(),
  ]);
  if (!book) notFound();

  return (
    <div className="space-y-4 px-2 md:px-6 [--border:0_55%_87%] [--input:0_55%_87%]">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/admin/books" className="transition-colors hover:text-black">
          Buku
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-black">Ubah Buku</span>
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
          <h2 className="text-2xl font-bold">Ubah Buku</h2>
          <p className="text-sm text-muted-foreground">{book.title}</p>
        </div>
      </div>

      <BookForm
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
        initial={{
          id: book.id,
          title: book.title,
          publisher: book.publisher,
          info: book.info,
          image: book.image,
          price: book.price,
          stock: book.stock,
          status: book.status,
          formats: book.formats,
          batchPrices: book.batchPrices.map((bp) => ({ batchId: bp.batchId, price: bp.price, formats: bp.formats as string[] })),
        }}
      />
    </div>
  );
}
