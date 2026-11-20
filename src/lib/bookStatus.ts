import { BOOK_STATUSES } from "@/lib/orderOptions";

export type BookStoredStatus = "READY_STOCK" | "PRE_ORDER";
export type BookStockStatus = BookStoredStatus | "OUT_OF_STOCK";

/**
 * Status filter options for the admin books list. Unlike `BOOK_STATUSES`
 * (the stored enum shared with toys), this list includes the derived
 * `OUT_OF_STOCK` value used when a book has no stock left.
 */
export const BOOK_STOCK_STATUS_FILTERS = [
  ...BOOK_STATUSES,
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
] as const;

export const BOOK_STOCK_STATUS_VALUES = [
  "READY_STOCK",
  "PRE_ORDER",
  "OUT_OF_STOCK",
] as const;

export type BookStockStatusFilter = (typeof BOOK_STOCK_STATUS_VALUES)[number];

export function isBookStockStatusFilter(
  value: string
): value is BookStockStatusFilter {
  return (BOOK_STOCK_STATUS_VALUES as readonly string[]).includes(value);
}

/**
 * Effective status shown in the UI. Stock is adjusted automatically when
 * orders are created or updated, so `OUT_OF_STOCK` is derived at read time
 * instead of being persisted (a stored value would go stale). The stored
 * `status` is kept intact and applies again once stock is replenished.
 */
export function resolveBookStatus(
  stock: number,
  status: BookStoredStatus
): BookStockStatus {
  return stock <= 0 ? "OUT_OF_STOCK" : status;
}

export function bookStatusLabel(status: BookStockStatus): string {
  if (status === "OUT_OF_STOCK") return "Out of Stock";
  return status === "PRE_ORDER" ? "Pre Order" : "Ready Stok";
}
