import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrderForm } from "@/components/OrderForm";
import {
  getBatches,
  getBookBatchPricesForOrderForm,
  getBooksForOrderForm,
  getToysForOrderForm,
} from "@/server/queries/catalog";
import { db } from "@/lib/db";

export default async function NewOrderPage() {
  const [buyers, books, toys, batches, batchPrices] = await Promise.all([
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

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          aria-label="Kembali ke daftar pesanan"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-[#D97A7A] text-white transition-colors hover:bg-[#c96666]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h2 className="text-xl font-bold leading-tight sm:text-2xl">Buat Pesanan</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Lengkapi detail pesanan di bawah ini untuk membuat pesanan baru.
          </p>
        </div>
      </div>
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
