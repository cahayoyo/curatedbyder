import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { CSSProperties } from "react";
import { OrderForm } from "@/components/OrderForm";
import {
  getBatches,
  getBookBatchPricesForOrderForm,
  getBooksForOrderForm,
  getToysForOrderForm,
} from "@/server/queries/catalog";

const softBorders = {
  "--border": "211 15% 73%",
  "--input": "211 15% 73%",
} as CSSProperties;

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SUPER_ADMIN");
  const { id } = await params;
  const [order, buyers, books, toys, batches, batchPrices] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { id: "asc" },
          select: { bookId: true, toyId: true, batchId: true, eta: true, quantity: true, unitPrice: true },
        },
        payments: { orderBy: { createdAt: "asc" } },
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
    <div className="-mx-5 -mt-4 -mb-24 bg-[#FBF9F9] md:-mx-8 xl:-mb-4" style={softBorders}>
      <div className="w-full space-y-4 px-5 pt-4 pb-24 md:px-8 xl:pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            aria-label="Kembali ke daftar pesanan"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight sm:text-2xl">Ubah Pesanan</h2>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              Invoice {order.invoiceNumber} — perbarui detail pesanan sesuai kebutuhan.
            </p>
          </div>
        </div>
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
          dpProofUrl: order.dpProofUrl,
          shippingCost: order.shippingCost,
          trackingNumber: order.trackingNumber,
          paymentStatus: order.paymentStatus,
          payments: order.payments.map((p) => ({
            id: p.id,
            amount: p.amount,
            proofUrl: p.proofUrl,
            note: p.note,
            paidAt: p.paidAt,
          })),
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
    </div>
  );
}