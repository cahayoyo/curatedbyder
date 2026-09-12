import { Prisma } from "@prisma/client";
import { dbApp } from "./db";

export type RlsTx = Prisma.TransactionClient;

// Runs `fn` inside a transaction on the RLS-subject `app_user` connection with
// `app.user_id` set transaction-locally, so Postgres row-level security (see
// the `_enable_rls_buyer_orders` migration) scopes Order/OrderItem/OrderPayment
// to that buyer — even if a query forgets the app-level `buyerId` filter.
// `set_config(..., true)` is transaction-scoped, so nothing leaks on pooled
// connections.
export async function withBuyer<T>(
  userId: string,
  fn: (tx: RlsTx) => Promise<T>
): Promise<T> {
  return dbApp.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.user_id', ${userId}, true)`;
    return fn(tx);
  });
}
