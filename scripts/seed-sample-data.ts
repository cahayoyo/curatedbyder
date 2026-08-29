import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Seed data contoh untuk local/dev DB — idempotent (aman dijalankan berulang).
const db = new PrismaClient();

const BATCH_NAME = "SAMPLE-2026-08";

const BOOKS = [
  { title: "Kisah Kota Hutan", publisher: "Pustaka Sample", price: 85000, formats: ["HC", "PB"] as const, stock: 10 },
  { title: "Petualangan Laut Biru", publisher: "Pustaka Sample", price: 65000, formats: ["PB"] as const, stock: 15 },
  { title: "Ensiklopedia Sains Anak", publisher: "Pustaka Sample", price: 150000, formats: ["HC", "SET"] as const, stock: 5 },
];

const TOYS = [
  { title: "Puzzle Huruf Kayu", price: 45000, stock: 20 },
  { title: "Boneka Kelinci", price: 75000, stock: 8 },
];

async function main() {
  const batch = await db.batch.upsert({
    where: { name: BATCH_NAME },
    update: {},
    create: { name: BATCH_NAME },
  });

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
    console.log(`book: ${b.title}`);
  }

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
    console.log(`toy: ${t.title}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
