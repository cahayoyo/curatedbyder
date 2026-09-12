import { readFileSync } from "node:fs";
import { createPrismaClient } from "../src/lib/prismaClient";

// Verifies the row-level security policies from
// `prisma/migrations/*_enable_rls_buyer_orders` against the dev database.
//
// Usage (dev DB only):
//   npx tsx scripts/verify-rls.ts
//
// Requires APP_DATABASE_URL to point at the non-owner `app_user` role (see
// .env / .env.example). Exits non-zero if the isolation guarantees are broken.

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trimStart().startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i === -1) continue;
      const key = line.slice(0, i).trim();
      const val = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {}
}
loadEnv();

let failed = false;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed = true;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

const owner = createPrismaClient();
const appUrl = process.env.APP_DATABASE_URL;
if (!appUrl) {
  console.error("APP_DATABASE_URL is not set — nothing to verify.");
  process.exit(1);
}
const app = createPrismaClient(appUrl);

async function main() {
  const pick = await owner.$queryRawUnsafe<{ buyerId: string; n: number }[]>(
    `SELECT "buyerId"::text AS "buyerId", count(*)::int AS n FROM "Order"
     GROUP BY "buyerId" HAVING count(*) > 1 ORDER BY count(*) DESC LIMIT 1`
  );
  if (!pick[0]) {
    console.log("SKIP: need a buyer with >1 order.");
    return;
  }
  const buyerId = pick[0].buyerId;
  const expected = pick[0].n;

  check("app_user without context sees 0 orders", await app.order.count(), 0);

  const scoped = await app.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.user_id', ${buyerId}, true)`;
    const rows = await tx.order.findMany({ select: { buyerId: true } });
    return { count: rows.length, distinct: new Set(rows.map((r) => r.buyerId)).size };
  });
  check("scoped query count", scoped.count, expected);
  check("scoped query single buyer", scoped.distinct, 1);

  const other = await owner.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id::text FROM "Order" WHERE "buyerId" <> $1 LIMIT 1`,
    buyerId
  );
  if (other[0]) {
    const leak = await app.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.user_id', ${buyerId}, true)`;
      return tx.order.findUnique({ where: { id: other[0].id }, select: { id: true } });
    });
    check("cross-buyer read is blocked", leak, null);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await owner.$disconnect();
    await app.$disconnect();
    if (failed) process.exit(1);
  });
