import { PrismaClient, type Format } from "@prisma/client";
const p = new PrismaClient();

const PAIRS: {
  keepId: string;
  dropId: string;
  dropBatchId: string;
  variantPrice: number;
  variantFormats: Format[];
  dropFormats: Format[];
}[] = [
  {
    keepId: "cmt4n2cq20001se3gx0hvtce8",
    dropId: "cmt4n2coo0000se3ga95xi0ga",
    dropBatchId: "cmt4n0uwb0001seagdhezjo9s",
    variantPrice: 160000,
    variantFormats: ["PB"],
    dropFormats: ["PB"],
  },
  {
    keepId: "cmt4op2490000sergjrqromau",
    dropId: "cmt4nb5hw002asen8ssp3607l",
    dropBatchId: "cmt4nb1x00002sen8x9jv3f4v",
    variantPrice: 405000,
    variantFormats: ["SET"],
    dropFormats: ["SET"],
  },
];


(async () => {
  await p.$transaction(async (tx) => {
    for (const pair of PAIRS) {
      const keep = await tx.book.findUnique({ where: { id: pair.keepId } });
      const drop = await tx.book.findUnique({ where: { id: pair.dropId } });
      if (!keep || !drop) throw new Error(`missing book in pair: keep=${!!keep} drop=${!!drop}`);

      console.log(`\n== pair: ${JSON.stringify(drop.title)} -> ${JSON.stringify(keep.title)}`);

      await tx.bookBatchPrice.create({
        data: {
          bookId: pair.keepId,
          batchId: pair.dropBatchId,
          price: pair.variantPrice,
          formats: pair.variantFormats,
        },
      });
      console.log("   created bookBatchPrice: batch", pair.dropBatchId, "price", pair.variantPrice, "formats", pair.variantFormats.join(","));

      const repointed = await tx.orderItem.updateMany({
        where: { bookId: pair.dropId },
        data: { bookId: pair.keepId },
      });
      console.log("   repointed orderItem rows:", repointed.count);

      await tx.book.delete({ where: { id: pair.dropId } });
      console.log("   deleted book:", drop.title);
    }
  });

  console.log("\n-- verification --");
  const badRefs = await p.order.findMany({
    where: { items: { none: {} } },
    select: { id: true },
  });
  console.log("orders with zero items:", badRefs.length);
  for (const b of PAIRS) {
    const items = await p.orderItem.count({ where: { bookId: b.keepId } });
    const bps = await p.bookBatchPrice.count({ where: { bookId: b.keepId } });
    const book = await p.book.findUnique({
      where: { id: b.keepId },
      select: { title: true, price: true, formats: true, stock: true },
    });
    console.log(
      `   main=${b.keepId} "${book?.title}" price=${book?.price} formats=${book?.formats.join(",")} stock=${book?.stock} | items=${items} batchPrices=${bps}`
    );
  }
  await p.$disconnect();
})();