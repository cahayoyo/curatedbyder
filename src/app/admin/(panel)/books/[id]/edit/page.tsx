import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BookForm } from "@/components/BookForm";

export default async function EditBookPage({ params }: { params: { id: string } }) {
  const [book, batches] = await Promise.all([
    db.book.findUnique({
      where: { id: params.id },
      include: { batchPrices: { select: { batchId: true, price: true, formats: true } } },
    }),
    db.batch.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!book) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold">Ubah Buku: {book.title}</h2>
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