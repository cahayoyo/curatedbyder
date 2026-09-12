// Shared input bounds. Single source of truth for server-side zod schemas and
// the client-side maxLength / input filtering. Keep both sides in sync.
export const MAX_ID = 64;
export const MAX_NAME = 100;
export const MAX_PHONE = 20;
export const MAX_CONTACT = 500;
export const MAX_MONEY = 1_000_000_000;
export const MAX_RATE = 1_000_000;
export const MAX_QTY = 10_000;
export const MAX_STOCK = 1_000_000;
