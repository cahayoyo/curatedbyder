import { db } from "@/lib/db";

// "use cache" removed (hotfix #212): cached reads here + updateTag/revalidateTag
// in order actions stall the createOrder/updateOrder server action response
// (eternal submit spinner) under Next 16 cacheComponents. Revisit caching later.

export async function getBatches() {
  return db.batch.findMany({ orderBy: { name: "asc" } });
}

export async function getBooksForOrderForm() {
  return db.book.findMany({
    select: { id: true, title: true, price: true, stock: true, formats: true },
    orderBy: { title: "asc" },
  });
}

export async function getToysForOrderForm() {
  return db.toy.findMany({
    select: { id: true, title: true, price: true, stock: true },
    orderBy: { title: "asc" },
  });
}

export async function getBookBatchPricesForOrderForm() {
  return db.bookBatchPrice.findMany({
    select: { batchId: true, bookId: true, price: true, formats: true },
  });
}
