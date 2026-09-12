import { PrismaClient } from "@prisma/client";
import { createPrismaClient } from "./prismaClient";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaApp?: PrismaClient;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

// RLS-subject client: connects as the non-owner `app_user` role (see
// prisma/migrations/*_enable_rls_buyer_orders). Used only for buyer-scoped
// reads of the RLS-protected tables, always inside `withBuyer` so the
// transaction-scoped `app.user_id` is set. Falls back to the owner client when
// `APP_DATABASE_URL` is not configured, so rollout without the var is a no-op.
export const dbApp = process.env.APP_DATABASE_URL
  ? globalForPrisma.prismaApp ?? createPrismaClient(process.env.APP_DATABASE_URL)
  : db;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  if (dbApp !== db) globalForPrisma.prismaApp = dbApp;
}