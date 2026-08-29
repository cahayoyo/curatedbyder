import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Seed data dev (5 user, 5 buku, 5 mainan, 5 pesanan).
// Double guard: script ini menolak jalan jika DATABASE_URL menunjuk DB prod.
const db = new PrismaClient();

if (process.env.DATABASE_URL?.includes("ep-solitary-grass")) {
  console.error("AMAN: DATABASE_URL menunjuk DB PROD — seed dibatalkan");
  process.exit(1);
}
console.log("Target DB:", new URL(process.env.DATABASE_URL!).host);

const BATCH_NAME = "SAMPLE-2026-08";
const INV_DAY = "20260826";

const BUYERS = [
  { name: "Andi Saputra", username: "andi7001", phone: "081234567001", contact: "WA 081234567001" },
  { name: "Budi Santoso", username: "budi7002", phone: "081234567002", contact: "WA 081234567002" },
  { name: "Citra Dewi", username: "citra7003", phone: "081234567003", contact: "WA 081234567003" },
  { name: "Dina Maharani", username: "dina7004", phone: "081234567004", contact: "WA 081234567004" },
  { name: "Eko Prasetyo", username: "eko7005", phone: "081234567005", contact: "WA 081234567005" },
];

const BOOKS = [
  { title: "Serigala Dan Lumbung", publisher: "Pustaka Sample", price: 92000, formats: ["HC", "PB"] as const, stock: 12 },
  { title: "Anak Pelangi", publisher: "Pustaka Sample", price: 58000, formats: ["PB"] as const, stock: 20 },
  { title: "Petualangan Ke Pulau Cilik", publisher: "Pustaka Sample", price: 77000, formats: ["PB", "BB"] as const, stock: 9 },
  { title: "Kamus Bergambar Binatang", publisher: "Pustaka Sample", price: 135000, formats: ["HC"] as const, stock: 6 },
  { title: "Cerita Sebelum Tidur", publisher: "Pustaka Sample", price: 49000, formats: ["PB", "SB"] as const, stock: 25 },
];

const TOYS = [
  { title: "Mobil Remote Kontrol Mini", price: 185000, stock: 7 },
  { title: "Lego Blok 100 Pcs", price: 149000, stock: 11 },
  { title: "Yo-yo Premium", price: 35000, stock: 30 },
  { title: "Set Cat Air Anak", price: 62000, stock: 14 },
  { title: "Papan Edukasi Angka", price: 88000, stock: 10 },
];

type OrderSeed = {
  buyerIdx: number;
  status: "ORDER_PLACED" | "SHIPPING_TO_INDONESIA" | "ARRIVED_IN_INDONESIA" | "ARRIVED_AT_WAREHOUSE" | "SHIPPED_TO_CUSTOMER" | "ORDER_DELIVERED";
  eta: "AUG" | "SEP" | "OCT";
  dp: number | null;
  shippingCost: number;
  bookIdx: number;
  bookQty: number;
  toyIdx: number;
  toyQty: number;
  soldAt: Date;
  tracking?: string;
};

const ORDERS: OrderSeed[] = [
  { buyerIdx: 0, status: "ORDER_PLACED", eta: "SEP", dp: null, shippingCost: 15000, bookIdx: 0, bookQty: 1, toyIdx: 0, toyQty: 1, soldAt: new Date("2026-08-20T09:00:00Z") },
  { buyerIdx: 1, status: "SHIPPING_TO_INDONESIA", eta: "SEP", dp: 50000, shippingCost: 20000, bookIdx: 1, bookQty: 2, toyIdx: 1, toyQty: 1, soldAt: new Date("2026-08-21T10:30:00Z") },
  { buyerIdx: 2, status: "ARRIVED_AT_WAREHOUSE", eta: "OCT", dp: 100000, shippingCost: 12000, bookIdx: 2, bookQty: 1, toyIdx: 2, toyQty: 2, soldAt: new Date("2026-08-22T14:00:00Z") },
  { buyerIdx: 3, status: "SHIPPED_TO_CUSTOMER", eta: "OCT", dp: null, shippingCost: 18000, bookIdx: 3, bookQty: 1, toyIdx: 3, toyQty: 1, soldAt: new Date("2026-08-23T08:45:00Z"), tracking: "JX1234567890" },
  { buyerIdx: 4, status: "ORDER_DELIVERED", eta: "AUG", dp: null, shippingCost: 10000, bookIdx: 4, bookQty: 3, toyIdx: 4, toyQty: 1, soldAt: new Date("2026-08-24T16:20:00Z"), tracking: "JX0987654321" },
];

async function main() {
  const batch = await db.batch.upsert({
    where: { name: BATCH_NAME },
    update: {},
    create: { name: BATCH_NAME },
  });

  const buyers = [];
  for (const b of BUYERS) {
    buyers.push(
      await db.user.upsert({
        where: { username: b.username },
        update: { name: b.name, phone: b.phone, contact: b.contact },
        create: { name: b.name, username: b.username, phone: b.phone, contact: b.contact, role: "USER" },
      })
    );
    console.log(`user: ${b.username}`);
  }

  const books = [];
  for (const b of BOOKS) {
    const book = await db.book.upsert({
      where: { title: b.title },
      update: { publisher: b.publisher, price: b.price, stock: b.stock, formats: [...b.formats] },
      create: { title: b.title, publisher: b.publisher, price: b.price, stock: b.stock, formats: [...b.formats] },
    });
    await db.bookBatchPrice.upsert({
      where: { bookId_batchId: { bookId: book.id, batchId: batch.id } },
      update: { price: b.price, formats: [...b.formats] },
      create: { bookId: book.id, batchId: batch.id, price: b.price, formats: [...b.formats] },
    });
    books.push(book);
    console.log(`book: ${b.title}`);
  }

  const toys = [];
  for (const t of TOYS) {
    const toy = await db.toy.upsert({
      where: { title: t.title },
      update: { price: t.price, stock: t.stock },
      create: { title: t.title, price: t.price, stock: t.stock },
    });
    await db.toyBatchPrice.upsert({
      where: { toyId_batchId: { toyId: toy.id, batchId: batch.id } },
      update: { price: t.price },
      create: { toyId: toy.id, batchId: batch.id, price: t.price },
    });
    toys.push(toy);
    console.log(`toy: ${t.title}`);
  }

  for (let i = 0; i < ORDERS.length; i++) {
    const o = ORDERS[i];
    const invoiceNumber = `INVDER-${INV_DAY}-000${i + 1}`;
    const book = books[o.bookIdx];
    const toy = toys[o.toyIdx];
    const bookSub = book.price * o.bookQty;
    const toySub = toy.price * o.toyQty;
    const total = bookSub + toySub + o.shippingCost;
    const remaining = Math.max(0, total - (o.dp ?? 0));
    const paymentStatus = o.dp == null ? (remaining === 0 ? "LUNAS" : "NO_PAYMENT") : remaining === 0 ? "LUNAS" : "DONE_DP";

    await db.order.upsert({
      where: { invoiceNumber },
      update: {},
      create: {
        invoiceNumber,
        buyerId: buyers[o.buyerIdx].id,
        total,
        dp: o.dp,
        remaining,
        shippingCost: o.shippingCost,
        trackingNumber: o.tracking,
        paymentStatus,
        soldAt: o.soldAt,
        items: {
          create: [
            { bookId: book.id, toyId: null, batchId: batch.id, eta: o.eta, quantity: o.bookQty, unitPrice: book.price, subtotal: bookSub, status: o.status },
            { bookId: null, toyId: toy.id, batchId: batch.id, eta: o.eta, quantity: o.toyQty, unitPrice: toy.price, subtotal: toySub, status: o.status },
          ],
        },
      },
    });
    console.log(`order: ${invoiceNumber} (total ${total}, dp ${o.dp ?? 0}, remaining ${remaining}, ${paymentStatus})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
