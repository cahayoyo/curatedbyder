import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { OrderForm } from "@/components/OrderForm";
import { ShoppingCart } from "lucide-react";
import {
  getBatches,
  getBookBatchPricesForOrderForm,
  getBooksForOrderForm,
  getToysForOrderForm,
} from "@/server/queries/catalog";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, buyers, books, toys, batches, batchPrices] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { id: "asc" },
          select: { bookId: true, toyId: true, batchId: true, eta: true, quantity: true, unitPrice: true },
        },
      },
    }),
    db.user.findMany({
      where: { role: "USER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getBooksForOrderForm(),
    getToysForOrderForm(),
    getBatches(),
    getBookBatchPricesForOrderForm(),
  ]);

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <ShoppingCart className="h-6 w-6" />
        Ubah Pesanan: {order.invoiceNumber}
      </h2>
      <OrderForm
        buyers={buyers.map((b) => ({ id: b.id, name: b.name }))}
        books={books.map((b) => ({
          id: b.id,
          title: b.title,
          price: b.price,
          stock: b.stock,
          formats: b.formats,
        }))}
        toys={toys.map((t) => ({
          id: t.id,
          title: t.title,
          price: t.price,
          stock: t.stock,
        }))}
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
        batchPrices={batchPrices.map((bp) => ({ batchId: bp.batchId, bookId: bp.bookId, price: bp.price, formats: bp.formats }))}
        initial={{
          id: order.id,
          invoiceNumber: order.invoiceNumber,
          buyerId: order.buyerId,
          dp: order.dp,
          shippingCost: order.shippingCost,
          trackingNumber: order.trackingNumber,
          paymentStatus: order.paymentStatus,
          items: order.items.map((it) => ({
            bookId: it.bookId ?? "",
            toyId: it.toyId ?? "",
            batchId: it.batchId,
            eta: it.eta,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
        }}
      />
    </div>
  );
}