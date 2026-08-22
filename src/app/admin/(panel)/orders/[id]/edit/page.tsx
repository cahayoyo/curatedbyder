import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { OrderForm } from "@/components/OrderForm";

export default async function EditOrderPage({ params }: { params: { id: string } }) {
  const [order, buyers, books, batches] = await Promise.all([
    db.order.findUnique({
      where: { id: params.id },
      include: { items: { select: { bookId: true, quantity: true } } },
    }),
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

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold">Ubah Pesanan: {order.invoiceNumber}</h2>
      <OrderForm
        buyers={buyers.map((b) => ({ id: b.id, name: b.name }))}
        books={books.map((b) => ({
          id: b.id,
          title: b.title,
          price: b.price,
          stock: b.stock,
        }))}
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
        initial={{
          id: order.id,
          invoiceNumber: order.invoiceNumber,
          buyerId: order.buyerId,
          batchId: order.batchId,
          status: order.status,
          eta: order.eta,
          dp: order.dp,
          paymentStatus: order.paymentStatus,
          items: order.items.map((it) => ({
            bookId: it.bookId,
            quantity: it.quantity,
          })),
        }}
      />
    </div>
  );
}
