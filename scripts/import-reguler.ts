import "dotenv/config";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const FILE = "src/assets/temp/order2026.xlsx";
const SHEET = "REGULER";

const db = new PrismaClient();

const ETA_MAP: Record<string, string> = {
  JANUARY: "JAN",
  FEBRUARY: "FEB",
  MARCH: "MAR",
  APRIL: "APR",
  MAY: "MAY",
  JUNE: "JUN",
  JULY: "JUL",
  JULI: "JUL",
  AUGUST: "AUG",
  AGUSTUS: "AUG",
  SEPTEMBER: "SEP",
  OCTOBER: "OCT",
  NOVEMBER: "NOV",
  DECEMBER: "DEC",
};

function num(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? null : n;
}

function normalizeEta(v: unknown): string {
  return ETA_MAP[String(v || "").trim().toUpperCase()] || "JAN";
}

function normalizeFormat(v: unknown): string | null {
  const f = String(v || "").trim().toUpperCase();
  if (!f) return null;
  if (f === "BOXSET") return "SET";
  return f;
}

async function main() {
  const wb = XLSX.readFile(FILE);
  const ws = wb.Sheets[SHEET];
  if (!ws) throw new Error(`Sheet ${SHEET} not found`);
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null, raw: false });

  const headerRow = rows.findIndex((r) => r.some((c) => String(c).trim().toUpperCase() === "BATCH"));
  if (headerRow < 0) throw new Error("Header row not found");
  const header = rows[headerRow].map((c) => String(c).trim().toUpperCase());
  const idx = (name: string) => header.findIndex((h) => h === name);

  const iBatch = idx("BATCH");
  const iEta = idx("ETA");
  const iNama = idx("NAMA");
  const iJudul = idx("JUDUL") >= 0 ? idx("JUDUL") : idx("PRODUK");
  const iFormat = idx("FORMAT");
  const iQty = idx("QTY");
  const iHarga = idx("HARGA");
  const iTotal = idx("TOTAL");
  const iDp = idx("DP");
  const iRemaining = idx("REMAINING");
  const iPay = idx("STATUS PEMBAYARAN");
  const iStatus = idx("STATUS ORDER");

  const data = rows.slice(headerRow + 1).filter((r) => {
    const b = r[iBatch];
    const j = r[iJudul];
    return b != null && String(b).trim() !== "" && j != null && String(j).trim() !== "";
  });

  // parse rows
  const parsed = data.map((r) => ({
    batch: String(r[iBatch] ?? "").trim(),
    eta: normalizeEta(r[iEta]),
    nama: String(r[iNama] ?? "").trim(),
    judul: String(r[iJudul] ?? "").trim(),
    format: normalizeFormat(r[iFormat]) ?? "",
    qty: num(r[iQty]) ?? 1,
    harga: num(r[iHarga]) ?? 0,
    total: num(r[iTotal]) ?? 0,
    dp: num(r[iDp]) ?? 0,
    remaining: num(r[iRemaining]) ?? 0,
    payRaw: r[iPay] ? String(r[iPay]).trim() : "",
  }));

  // ---- SKIP OOS rows ----
  const filtered = parsed.filter((r) => r.payRaw.toUpperCase() !== "OOS");
  const skippedOos = parsed.length - filtered.length;
  console.log(`parsed: ${parsed.length}, after skip OOS: ${filtered.length}`);

  // ---- Determine book variants ----
  // If a title spans multiple distinct prices across its rows (regardless of format),
  // split into individual books per (format, price): `{Judul} {FORMAT} {3-digit price}`.
  // Otherwise keep the original title with the union of its formats.
  const pricesByTitle = new Map<string, Set<number>>();
  for (const r of filtered) {
    if (!pricesByTitle.has(r.judul)) pricesByTitle.set(r.judul, new Set());
    pricesByTitle.get(r.judul)!.add(r.harga);
  }

  const variantKey = new Map<string, string>();
  const books = new Map<string, { price: number; formats: string[]; title: string }>();
  for (const r of filtered) {
    const prices = Array.from(pricesByTitle.get(r.judul) ?? []).sort((a, b) => a - b);
    const needsSplit = prices.length > 1 && r.format;
    const title = needsSplit
      ? `${r.judul} ${r.format} ${String(r.harga).slice(0, 3)}`
      : r.judul;
    variantKey.set(`${r.judul}||${r.format}||${r.harga}`, title);
    if (!books.has(title)) {
      books.set(title, { title, price: r.harga, formats: r.format ? [r.format] : [] });
    } else {
      const b = books.get(title)!;
      if (r.format && !b.formats.includes(r.format)) b.formats.push(r.format);
    }
  }

  /* ---- import batch ----
   * batches: upsert new
   * books: check existing by title; if exists, keep (maybe update formats) else create
   * users: reuse existing by name (exact), else create with unique phone + username
   */

  const batchMap = new Map<string, string>();
  for (const r of filtered) {
    if (batchMap.has(r.batch)) continue;
    const b = await db.batch.upsert({
      where: { name: r.batch },
      update: {},
      create: { name: r.batch },
    });
    batchMap.set(r.batch, b.id);
  }

  const bookMap = new Map<string, string>();
  for (const b of Array.from(books.values())) {
    let existing = await db.book.findUnique({ where: { title: b.title }, select: { id: true } });
    if (!existing) {
      existing = await db.book.create({
        data: {
          title: b.title,
          price: b.price,
          formats: (b.formats as any),
          stock: 1000,
          status: "PRE_ORDER",
        },
      });
    }
    bookMap.set(b.title, existing.id);
  }

  const userMap = new Map<string, string>(); // name -> id
  // meet existing users once
  const existingUsers = await db.user.findMany({
    where: { role: "USER" },
    select: { id: true, name: true, phone: true },
  });
  const userByName = new Map<string, string>();
  for (const u of existingUsers) userByName.set(u.name.toLowerCase(), u.id);

  // phone counter: start after current max
  const maxPhone = await db.user.aggregate({
    where: { role: "USER", phone: { not: null } },
    _max: { phone: true },
  });
  const lastNum = maxPhone._max.phone ? Number(maxPhone._max.phone.slice(-4)) : 0;
  let phoneCounter = lastNum + 1;

  for (const r of filtered) {
    if (!r.nama) continue;
    if (userMap.has(r.nama)) continue;
    const existing = userByName.get(r.nama.toLowerCase());
    if (existing) {
      userMap.set(r.nama, existing);
    } else {
      const n = phoneCounter++;
      const phone = `0812${String(n).padStart(4, "0")}`;
      const firstName = r.nama.split(/\s+/)[0]?.toLowerCase() ?? "";
      const u = await db.user.create({
        data: { name: r.nama, role: "USER", phone, username: `${firstName}${String(n).padStart(4, "0")}` },
      });
      userMap.set(r.nama, u.id);
    }
  }

  // orders
  const today = new Date();
  const day = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const countToday = await db.order.count({
    where: { soldAt: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } },
  });
  let orderCounter = countToday + 1;

  let orderCreated = 0;
  for (const r of filtered) {
    if (!r.nama) { console.warn(`skip row no nama: ${r.judul}`); continue; }
    const userId = userMap.get(r.nama);
    if (!userId) { console.warn(`skip row no user: ${r.nama}`); continue; }
    const batchId = batchMap.get(r.batch);
    if (!batchId) { console.warn(`skip row no batch: ${r.batch}`); continue; }
    const variant = variantKey.get(`${r.judul}||${r.format}||${r.harga}`);
    const bookId = variant ? bookMap.get(variant) : bookMap.get(r.judul);
    if (!bookId) { console.warn(`skip row no book: ${r.judul}`); continue; }

    const payStatus = (() => {
      if (r.payRaw.toUpperCase() === "OOS") return "NO_PAYMENT"; // never hit (filtered)
      if (r.payRaw.toUpperCase() === "INV") return "DONE_DP";
      if (r.total === 0 && r.dp === 0) return "LUNAS";
      if (r.dp === r.total) return "LUNAS";
      if (r.dp > 0 && r.dp < r.total) return "DONE_DP";
      return "NO_PAYMENT";
    })();

    const invoiceNumber = `INVDER-${day}-${String(orderCounter).padStart(4, "0")}`;
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
        items: { create: [{ bookId, quantity: r.qty, unitPrice: r.harga, subtotal: r.harga * r.qty }] },
      },
    });
    orderCreated++;
  }

  console.log(
    "Import done:",
    JSON.stringify({
      batches: batchMap.size,
      users: userMap.size,
      books: bookMap.size,
      orders: orderCreated,
      skippedOos,
      skippedRows: filtered.length - orderCreated,
    })
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());