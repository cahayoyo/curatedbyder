import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const books = await p.book.findMany({
    select: { id: true, title: true, price: true, stock: true, status: true }
  });
  const re = /\s(HC|PB|BB|SET|SB)\s*$/i;
  const re2 = /\s(HC|PB|BB|SET|SB)(\s|[0-9]|$)/i;
  const hits = books.filter(b => re.test(b.title) || re2.test(b.title));
  console.log("total", books.length);
  for (const b of hits) console.log(`${b.id}\t${b.price}\t${b.stock}\t${b.status}\t${b.title}`);
  console.log("matched", hits.length);
  await p.$disconnect();
})();
