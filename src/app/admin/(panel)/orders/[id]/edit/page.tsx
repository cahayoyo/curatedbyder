import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { OrderForm } from "@/components/OrderForm";

export default async function EditOrderPage({ params }: { params: { id: string } }) {
  await requireRole("SUPER_ADMIN");

  const [order, buyers, books] = await Promise.all([
    db.order.findUnique({
      where: { id: params.id },
      include: { items: { select: { bookId: true, quantity: true } } },
    }),
    db.user.findMany({ where: { role: "USER" }, orderBy: { name: "asc" } }),
    db.book.findMany({ orderBy: { title: "asc" } }),
  ]);

  if (!order) notFound();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Ubah Order: {order.invoiceNumber}</h2>
      <OrderForm
        buyers={buyers.map((b) => ({ id: b.id, name: b.name }))}
        books={books.map((b) => ({
          id: b.id,
          title: b.title,
          price: b.price,
          stock: b.stock,
        }))}
        initial={{
          id: order.id,
          invoiceNumber: order.invoiceNumber,
          buyerId: order.buyerId,
          source: order.source,
          batch: order.batch,
          status: order.status,
          eta: order.eta,
          format: order.format,
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
