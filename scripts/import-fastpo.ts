import "dotenv/config";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const FILE =
  "src/assets/temp/order2026.xlsx";
const SHEET = "FAST PO";

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
  const key = String(v || "").trim().toUpperCase();
  return ETA_MAP[key] || "JAN";
}

function normalizeFormat(v: unknown): string | null {
  const f = String(v || "").trim().toUpperCase();
  if (!f) return null;
  if (f === "BOXSET") return "SET";
  return f;
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

async function main() {
  const wb = XLSX.readFile(FILE);
  const ws = wb.Sheets[SHEET];
  if (!ws) throw new Error(`Sheet ${SHEET} not found`);
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, {
    header: 1,
    defval: null,
    raw: false,
  });

  const headerRow = rows.findIndex((r) =>
    r.some((c) => String(c).trim().toUpperCase() === "BATCH")
  );
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

  // forward-fill nama (if "-" or empty, use previous non-empty)
  let lastNama: string | null = null;
  const parsed = data.map((r) => {
    const rawNama = String(r[iNama] ?? "").trim();
    if (rawNama && rawNama !== "-") {
      lastNama = rawNama;
    }
    const nama = rawNama && rawNama !== "-" ? rawNama : (lastNama ?? "");
    return {
      batch: String(r[iBatch] ?? "").trim(),
      eta: normalizeEta(r[iEta]),
      nama,
      judul: String(r[iJudul] ?? "").trim(),
      format: normalizeFormat(r[iFormat]),
      qty: num(r[iQty]) ?? 1,
      harga: num(r[iHarga]) ?? 0,
      total: num(r[iTotal]) ?? 0,
      dp: num(r[iDp]) ?? 0,
      remaining: num(r[iRemaining]) ?? 0,
      payRaw: r[iPay] ? String(r[iPay]).trim() : "",
      statusRaw: r[iStatus] ? String(r[iStatus]).trim() : "",
    };
  });

  if (parsed.length === 0) throw new Error("No data rows");

  // ---------- Build maps ----------
  const batchMap = new Map<string, string>(); // name -> id
  const userMap = new Map<string, string>(); // name -> id
  const bookMap = new Map<string, string>(); // title -> id
  const bookPrice = new Map<string, number>();
  const bookFormats = new Map<string, string[]>();
  const userPhoneIdx = new Map<string, number>();

  let phoneCounter = 1;

    // Batches
    for (const r of parsed) {
      if (!batchMap.has(r.batch)) {
        const b = await db.batch.upsert({
          where: { name: r.batch },
          update: {},
          create: { name: r.batch },
        });
        batchMap.set(r.batch, b.id);
      }
    }

    // Books: first pass for price + formats
    for (const r of parsed) {
      const t = r.judul;
      if (bookMap.has(t)) continue;
      const existing = await db.book.findUnique({
        where: { title: t },
        select: { id: true, price: true, formats: true },
      });
      if (existing) {
        bookMap.set(t, existing.id);
        bookPrice.set(t, existing.price);
        bookFormats.set(t, existing.formats);
      } else {
        bookMap.set(t, "");
        bookPrice.set(t, null as unknown as number);
      }
    }
    // determine price per title (non-zero preferred)
    for (const r of parsed) {
      const t = r.judul;
      if (bookPrice.get(t) == null || (bookPrice.get(t) === 0 && r.harga > 0)) {
        bookPrice.set(t, r.harga);
      }
    }
    // formats per title
    for (const r of parsed) {
      if (r.format) {
        const cur = bookFormats.get(r.judul) ?? [];
        if (!cur.includes(r.format)) bookFormats.set(r.judul, [...cur, r.format]);
      }
    }
    const formatType = ["HC", "PB", "BB", "SET", "SB"] as const;
    const fmt = (arr: string[]) => arr.filter((f) => (formatType as readonly string[]).includes(f)) as (typeof formatType)[number][];
    // create missing books
    for (const t of Array.from(bookMap.keys())) {
      if (bookMap.get(t) === "") {
        const b = await db.book.create({
          data: {
            title: t,
            price: bookPrice.get(t) ?? 0,
            stock: 1000,
            status: "PRE_ORDER",
            formats: fmt(bookFormats.get(t) ?? []),
          },
        });
        bookMap.set(t, b.id);
      }
    }

    // Users (buyers)
    for (const r of parsed) {
      if (!r.nama) continue;
      if (userMap.has(r.nama)) continue;
      const existing = await db.user.findFirst({
        where: { name: r.nama, role: "USER" },
      });
      if (existing) {
        userMap.set(r.nama, existing.id);
      } else {
        const n = userPhoneIdx.get(r.nama) ?? phoneCounter++;
        userPhoneIdx.set(r.nama, n);
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

    // Orders
    const today = new Date();
    const day = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
      today.getDate()
    ).padStart(2, "0")}`;

    const existingToday = await db.order.count({
      where: {
        soldAt: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) },
      },
    });
    let orderCounter = existingToday + 1;

    for (const r of parsed) {
      if (!r.nama) {
        console.warn(`SKIP row (no nama): ${r.judul}`);
        continue;
      }
      const userId = userMap.get(r.nama);
      if (!userId) throw new Error(`No user for ${r.nama}`);
      const batchId = batchMap.get(r.batch);
      if (!batchId) throw new Error(`No batch ${r.batch}`);
      const bookId = bookMap.get(r.judul);
      if (!bookId) throw new Error(`No book ${r.judul}`);

      const qty = r.qty;
      const unitPrice = r.harga;
      const subTotal = unitPrice * qty;

      const payStatus = (() => {
        if (r.total === 0 && r.dp === 0) return "LUNAS";
        if (r.dp === r.total) return "LUNAS";
        if (r.dp > 0 && r.dp < r.total) return "DONE_DP";
        return "NO_PAYMENT";
      })();
      const orderStatus = "ORDER_PLACED";

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
          status: orderStatus as never,
          items: {
            create: [
              {
                bookId,
                quantity: qty,
                unitPrice,
                subtotal: subTotal,
              },
            ],
          },
        },
      });
    }

    console.log(
      "Import done:",
      JSON.stringify({
        batches: batchMap.size,
        users: userMap.size,
        books: bookMap.size,
        orders: parsed.length,
      })
    );
  }

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());