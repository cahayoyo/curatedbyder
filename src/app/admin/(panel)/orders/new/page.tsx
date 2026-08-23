import { db } from "@/lib/db";
import { OrderForm } from "@/components/OrderForm";

export default async function NewOrderPage() {
  const [buyers, books, toys, batches, batchPrices] = await Promise.all([
    db.user.findMany({
      where: { role: "USER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.book.findMany({
      select: { id: true, title: true, price: true, stock: true, formats: true },
      orderBy: { title: "asc" },
    }),
    db.toy.findMany({
      select: { id: true, title: true, price: true, stock: true },
      orderBy: { title: "asc" },
    }),
    db.batch.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.bookBatchPrice.findMany({
      select: { batchId: true, bookId: true, price: true, formats: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold">Buat Pesanan</h2>
      <OrderForm
        buyers={buyers.map((b) => ({ id: b.id, name: b.name }))}
        books={books.map((b) => ({ id: b.id, title: b.title, price: b.price, stock: b.stock, formats: b.formats }))}
        toys={toys.map((t) => ({ id: t.id, title: t.title, price: t.price, stock: t.stock }))}
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
        batchPrices={batchPrices.map((bp) => ({ batchId: bp.batchId, bookId: bp.bookId, price: bp.price, formats: bp.formats }))}
      />
    </div>
  );
}