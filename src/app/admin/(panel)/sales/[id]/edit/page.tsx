import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { SalesForm } from "@/components/SalesForm";

export default async function EditSalePage({ params }: { params: { id: string } }) {
  await requireRole("SUPER_ADMIN");

  const [sale, buyers, books] = await Promise.all([
    db.sale.findUnique({
      where: { id: params.id },
      include: { items: { select: { bookId: true, quantity: true } } },
    }),
    db.user.findMany({ where: { role: "USER" }, orderBy: { name: "asc" } }),
    db.book.findMany({ orderBy: { title: "asc" } }),
  ]);

  if (!sale) notFound();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Ubah Order: {sale.invoiceNumber}</h2>
      <SalesForm
        buyers={buyers.map((b) => ({ id: b.id, name: b.name }))}
        books={books.map((b) => ({
          id: b.id,
          title: b.title,
          price: b.price,
          stock: b.stock,
        }))}
        initial={{
          id: sale.id,
          invoiceNumber: sale.invoiceNumber,
          buyerId: sale.buyerId,
          source: sale.source,
          status: sale.status,
          eta: sale.eta,
          format: sale.format,
          dp: sale.dp,
          paymentStatus: sale.paymentStatus,
          items: sale.items.map((it) => ({
            bookId: it.bookId,
            quantity: it.quantity,
          })),
        }}
      />
    </div>
  );
}
