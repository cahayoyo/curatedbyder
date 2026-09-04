import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBook, deleteBook, setBookBatchPrices, updateBook } from "./books";

const requireAdmin = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const updateTag = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({ requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath, updateTag }));

const db = vi.hoisted(() => ({
  book: {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  orderItem: { count: vi.fn().mockResolvedValue(0) },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db }));

const baseInput = {
  title: "Buku A",
  price: 10000,
  stock: 5,
  formats: ["PB"],
};

beforeEach(() => {
  vi.clearAllMocks();
  db.book.findUnique.mockResolvedValue(null);
  db.orderItem.count.mockResolvedValue(0);
});

describe("book mutations invalidate cache tags", () => {
  it("createBook revalidates the books tag", async () => {
    db.book.create.mockResolvedValue({ id: "b1", title: "Buku A" });

    const result = await createBook(baseInput as Parameters<typeof createBook>[0]);

    expect(result.ok).toBe(true);
    expect(updateTag).toHaveBeenCalledWith("books");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/books");
  });

  it("updateBook revalidates the books tag", async () => {
    db.book.update.mockResolvedValue({ id: "b1", title: "Buku A" });

    const result = await updateBook("b1", baseInput as Parameters<typeof updateBook>[1]);

    expect(result.ok).toBe(true);
    expect(updateTag).toHaveBeenCalledWith("books");
  });

  it("deleteBook revalidates both the books and bookBatchPrices tags", async () => {
    db.book.delete.mockResolvedValue({ id: "b1" });

    const result = await deleteBook("b1");

    expect(result).toEqual({ ok: true });
    expect(updateTag).toHaveBeenCalledWith("books");
    expect(updateTag).toHaveBeenCalledWith("bookBatchPrices");
  });

  it("deleteBook refuses a book with sold items", async () => {
    db.orderItem.count.mockResolvedValue(2);

    const result = await deleteBook("b1");

    expect(result.ok).toBe(false);
    expect(db.book.delete).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("setBookBatchPrices revalidates the bookBatchPrices tag", async () => {
    await setBookBatchPrices({
      bookId: "b1",
      entries: [{ batchId: "bt1", price: 12000, formats: ["PB"] }],
    });

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(updateTag).toHaveBeenCalledWith("bookBatchPrices");
  });
});
