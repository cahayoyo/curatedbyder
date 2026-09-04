import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBatches,
  getBookBatchPricesForOrderForm,
  getBooksForOrderForm,
  getToysForOrderForm,
} from "./catalog";

const cacheTag = vi.hoisted(() => vi.fn());
const revalidateTag = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ cacheTag, revalidateTag }));

const db = vi.hoisted(() => ({
  batch: { findMany: vi.fn() },
  book: { findMany: vi.fn() },
  toy: { findMany: vi.fn() },
  bookBatchPrice: { findMany: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ db }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("cached catalog readers", () => {
  it("getBatches lists all batches by name under the batches tag", async () => {
    db.batch.findMany.mockResolvedValue([{ id: "bt1", name: "READY STOCK" }]);

    const result = await getBatches();

    expect(db.batch.findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
    expect(cacheTag).toHaveBeenCalledWith("batches");
    expect(result).toEqual([{ id: "bt1", name: "READY STOCK" }]);
  });

  it("getBooksForOrderForm selects order-form fields under the books tag", async () => {
    db.book.findMany.mockResolvedValue([]);

    await getBooksForOrderForm();

    expect(db.book.findMany).toHaveBeenCalledWith({
      select: { id: true, title: true, price: true, stock: true, formats: true },
      orderBy: { title: "asc" },
    });
    expect(cacheTag).toHaveBeenCalledWith("books");
  });

  it("getToysForOrderForm selects order-form fields under the toys tag", async () => {
    db.toy.findMany.mockResolvedValue([]);

    await getToysForOrderForm();

    expect(db.toy.findMany).toHaveBeenCalledWith({
      select: { id: true, title: true, price: true, stock: true },
      orderBy: { title: "asc" },
    });
    expect(cacheTag).toHaveBeenCalledWith("toys");
  });

  it("getBookBatchPricesForOrderForm selects price rows under the bookBatchPrices tag", async () => {
    db.bookBatchPrice.findMany.mockResolvedValue([]);

    await getBookBatchPricesForOrderForm();

    expect(db.bookBatchPrice.findMany).toHaveBeenCalledWith({
      select: { batchId: true, bookId: true, price: true, formats: true },
    });
    expect(cacheTag).toHaveBeenCalledWith("bookBatchPrices");
  });
});
