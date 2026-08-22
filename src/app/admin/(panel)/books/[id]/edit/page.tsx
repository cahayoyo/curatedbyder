import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BookForm } from "@/components/BookForm";

export default async function EditBookPage({ params }: { params: { id: string } }) {
  const book = await db.book.findUnique({ where: { id: params.id } });
  if (!book) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold">Ubah Buku: {book.title}</h2>
      <BookForm
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
        }}
      />
    </div>
  );
}