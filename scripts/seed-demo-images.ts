import { db } from "../src/lib/db";

const FILES = [
  "/seed/book-1.webp",
  "/seed/book-2.jpg",
  "/seed/book-3.jpg",
  "/seed/book-4.jpg",
  "/seed/book-5.jpg",
  "/seed/book-6.jpg",
  "/seed/book-7.webp",
];

async function main() {
  const books = await db.book.findMany({
    where: { image: null },
    orderBy: { createdAt: "asc" },
    take: FILES.length,
    select: { id: true, title: true },
  });

  for (let i = 0; i < books.length; i++) {
    await db.book.update({ where: { id: books[i].id }, data: { image: FILES[i] } });
    console.log(`buku  ${books[i].title} -> ${FILES[i]}`);
  }

  const toys = await db.toy.findMany({
    where: { image: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true },
  });

  for (let i = 0; i < toys.length; i++) {
    const file = FILES[i % FILES.length];
    await db.toy.update({ where: { id: toys[i].id }, data: { image: file } });
    console.log(`mainan ${toys[i].title} -> ${file}`);
  }

  console.log(`selesai: ${books.length} buku, ${toys.length} mainan diisi foto demo`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
