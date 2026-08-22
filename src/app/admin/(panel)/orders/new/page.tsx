import { db } from "@/lib/db";
import { OrderForm } from "@/components/OrderForm";

export default async function NewOrderPage() {
  const [buyers, books, batches] = await Promise.all([
    db.user.findMany({
      where: { role: "USER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.book.findMany({
      select: { id: true, title: true, price: true, stock: true },
      orderBy: { title: "asc" },
    }),
    db.batch.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold">Buat Pesanan</h2>
      <OrderForm
        buyers={buyers.map((b) => ({ id: b.id, name: b.name }))}
        books={books.map((b) => ({ id: b.id, title: b.title, price: b.price, stock: b.stock }))}
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}