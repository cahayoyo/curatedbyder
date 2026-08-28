import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const items = await p.orderItem.findMany({
    where: { book: { title: { startsWith: "Grow : Secrets of DNA" } } },
    select: {
      id: true,
      quantity: true,
      unitPrice: true,
      subtotal: true,
      bookId: true,
      order: {
        select: {
          id: true,
          invoiceNumber: true,
          batch: { select: { name: true } },
          eta: true,
          buyer: { select: { name: true, email: true } },
          soldAt: true,
        },
      },
    },
    orderBy: { order: { soldAt: "asc" } },
  });
  console.log("Grow items:", items.length);
  for (const i of items)
    console.log(
      `${i.order.invoiceNumber}\tbook=${(i.bookId ?? "").slice(0, 8)}\tunit=${i.unitPrice}\tqty=${i.quantity}\tbuyer=${i.order.buyer.name}\tbatch=${i.order.batch.name}\teta=${i.order.eta}`
    );

  const bp = await p.bookBatchPrice.findMany({
    where: { book: { title: { startsWith: "Grow : Secrets of DNA" } } },
    select: { price: true, formats: true, batch: { select: { name: true } } },
  });
  console.log("\nGrow batchPrices:", JSON.stringify(bp, null, 2));
  await p.$disconnect();
})();