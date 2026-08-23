import "dotenv/config";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const FILE = "src/assets/temp/order2026.xlsx";
const SHEET = "TOYS";

const db = new PrismaClient();

const ETA_MAP: Record<string, string> = {
  SEPTEMBER: "SEP",
  OCTOBER: "OCT",
};

function num(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isNaN(n) ? null : n;
}

function normalizeEta(v: unknown): string {
  return ETA_MAP[String(v || "").trim().toUpperCase()] || "JAN";
}

function normalizeTitle(v: unknown): string {
  return String(v || "").replace(/\s+/g, " ").trim();
}

async function main() {
  const wb = XLSX.readFile(FILE);
  const ws = wb.Sheets[SHEET];
  if (!ws) throw new Error(`Sheet ${SHEET} not found`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
  });

  const parsed = rows
    .map((r) => ({
      batch: String(r["BATCH"] ?? "").trim(),
      eta: normalizeEta(r["ETA"]),
      nama: String(r["NAMA"] ?? "").trim(),
      judul: normalizeTitle(r["PRODUK"]),
      qty: num(r["QTY"]) ?? 1,
      harga: num(r["HARGA"]) ?? 0,
      total: num(r["TOTAL"]) ?? 0,
      dp: num(r["DP"]) ?? 0,
      remaining: num(r["REMANING"]) ?? 0,
    }))
    .filter(
      (r) =>
        r.nama &&
        r.judul &&
        (r.harga > 0 || r.total > 0)
    );

  console.log(`parsed rows with buyer+product: ${parsed.length}`);

  // ---- Toy catalog: unique name -> { price, formats } ----
  const toyDefs = new Map<
    string,
    { price: number; priceCount: Map<number, number> }
  >();
  for (const r of parsed) {
    if (!toyDefs.has(r.judul)) toyDefs.set(r.judul, { price: r.harga, priceCount: new Map() });
    const def = toyDefs.get(r.judul)!;
    def.priceCount.set(r.harga, (def.priceCount.get(r.harga) ?? 0) + 1);
  }
  // pick most-common price as the catalog price
  const toyPrice = new Map<string, number>();
  for (const [title, def] of Array.from(toyDefs)) {
    let best = def.price;
    let bestN = -1;
    for (const [pr, n] of Array.from(def.priceCount)) {
      if (n > bestN) {
        best = pr;
        bestN = n;
      }
    }
    toyPrice.set(title, best);
  }
  console.log("distinct toys to create:", toyDefs.size);

  // ---- batch upsert ----
  const batchNames = Array.from(new Set(parsed.map((r) => r.batch)));
  const batchMap = new Map<string, string>();
  for (const name of batchNames) {
    const b = await db.batch.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    batchMap.set(name, b.id);
  }

  // ---- toy upsert ----
  const toyMap = new Map<string, string>();
  for (const [title, price] of Array.from(toyPrice)) {
    let existing = await db.toy.findUnique({ where: { title } });
    if (!existing) {
      existing = await db.toy.create({
        data: { title, price, stock: 0, status: "PRE_ORDER", formats: [] },
      });
    }
    toyMap.set(title, existing.id);
  }

  // ---- users: reuse by name ----
  const existingUsers = await db.user.findMany({
    where: { role: "USER" },
    select: { id: true, name: true },
  });
  const userByName = new Map<string, string>();
  for (const u of existingUsers) userByName.set(u.name.toLowerCase(), u.id);

  const maxPhone = await db.user.aggregate({
    where: { role: "USER", phone: { not: null } },
    _max: { phone: true },
  });
  const lastNum = maxPhone._max.phone ? Number(maxPhone._max.phone.slice(-4)) : 0;
  let phoneCounter = lastNum + 1;

  const userMap = new Map<string, string>();
  for (const r of parsed) {
    if (userMap.has(r.nama)) continue;
    const existing = userByName.get(r.nama.toLowerCase());
    if (existing) {
      userMap.set(r.nama, existing);
    } else {
      const n = phoneCounter++;
      const phone = `0812${String(n).padStart(4, "0")}`;
      const firstName = r.nama.split(/\s+/)[0]?.toLowerCase() ?? "";
      const u = await db.user.create({
        data: {
          name: r.nama,
          role: "USER",
          phone,
          username: `${firstName}${String(n).padStart(4, "0")}`,
        },
      });
      userMap.set(r.nama, u.id);
    }
  }

  // ---- invoice numbering: continue from max existing today ----
  const today = new Date();
  const day = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const prefix = `INVDER-${day}-`;
  const maxInvoice = await db.order.aggregate({
    where: { invoiceNumber: { startsWith: prefix } },
    _max: { invoiceNumber: true },
  });
  const lastSeq = Number(maxInvoice._max.invoiceNumber?.slice(-4) ?? 0);
  let orderCounter = lastSeq + 1;

  let orderCreated = 0;
  for (const r of parsed) {
    const userId = userMap.get(r.nama);
    const batchId = batchMap.get(r.batch);
    const toyId = toyMap.get(r.judul);
    if (!userId || !batchId || !toyId) {
      console.warn(`skip: ${r.nama} / ${r.judul}`);
      continue;
    }

    const payStatus = (() => {
      if (r.total === 0 && r.dp === 0) return "LUNAS";
      if (r.dp === r.total) return "LUNAS";
      if (r.dp > 0 && r.dp < r.total) return "DONE_DP";
      return "NO_PAYMENT";
    })();

    const invoiceNumber = `${prefix}-${String(orderCounter).padStart(4, "0")}`;
    orderCounter++;

    await db.order.create({
      data: {
        invoiceNumber,
        buyerId: userId,
        batchId,
        eta: r.eta as never,
        total: r.total,
        soldAt: today,
        dp: r.dp,
        remaining: r.remaining,
        shippingCost: 0,
        trackingNumber: null,
        paymentStatus: payStatus as never,
        status: "ORDER_PLACED" as never,
        items: {
          create: [
            {
              toy: { connect: { id: toyId } },
              quantity: r.qty,
              unitPrice: r.harga,
              subtotal: r.harga * r.qty,
            },
          ],
        },
      },
    });
    orderCreated++;
  }

  console.log(
    "Import done:",
    JSON.stringify({
      batches: batchMap.size,
      users: userMap.size,
      toys: toyMap.size,
      orders: orderCreated,
      lastInvoice: `INVDER-${day}-${String(orderCounter - 1).padStart(4, "0")}`,
    })
  );

  await db.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());