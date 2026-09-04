import { cacheTag } from "next/cache";
import { db } from "@/lib/db";

export async function getBatches() {
  "use cache";
  cacheTag("batches");
  return db.batch.findMany({ orderBy: { name: "asc" } });
}

export async function getBooksForOrderForm() {
  "use cache";
  cacheTag("books");
  return db.book.findMany({
    select: { id: true, title: true, price: true, stock: true, formats: true },
    orderBy: { title: "asc" },
  });
}

export async function getToysForOrderForm() {
  "use cache";
  cacheTag("toys");
  return db.toy.findMany({
    select: { id: true, title: true, price: true, stock: true },
    orderBy: { title: "asc" },
  });
}

export async function getBookBatchPricesForOrderForm() {
  "use cache";
  cacheTag("bookBatchPrices");
  return db.bookBatchPrice.findMany({
    select: { batchId: true, bookId: true, price: true, formats: true },
  });
}
