import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const toys = await p.toy.count();
  const toyOrders = await p.order.count({ where: { items: { some: { toy: { isNot: null } } } } });
  const orphan = await p.orderItem.count({ where: { book: null, toyId: null } });
  const sumOI = await p.orderItem.aggregate({ _sum: { subtotal: true } });
  const sumO = await p.order.aggregate({ _sum: { total: true } });
  const countO = await p.order.count();
  const batch = await p.batch.findUnique({ where: { name: "PO TOYS" }, select: { id: true } });
  console.log({ toys, toyOrders, orphanOI: orphan, countO, sumOI: sumOI._sum.subtotal, sumO: sumO._sum.total, batchExists: !!batch });

  const items = await p.orderItem.findMany({
    where: { toy: { isNot: null } },
    select: {
      quantity: true, unitPrice: true, subtotal: true,
      toy: { select: { title: true } },
      order: { select: { invoiceNumber: true, buyer: { select: { name: true } }, batch: { select: { name: true } }, eta: true, total: true } },
    },
    take: 8,
  });
  console.log("\nfirst 8 toy items:");
  for (const i of items)
    console.log(`  ${i.order.invoiceNumber} | ${i.order.buyer.name} | ${i.toy?.title} | ${i.order.batch.name} | ${i.order.eta} | q=${i.quantity} u=${i.unitPrice} sub=${i.subtotal} total=${i.order.total}`);

  const byTitle = new Map<string, { q: number; o: number }>();
  const all = await p.orderItem.findMany({ where: { toy: { isNot: null } }, select: { quantity: true, toy: { select: { title: true } } } });
  for (const i of all) {
    const t = i.toy?.title ?? "?";
    if (!byTitle.has(t)) byTitle.set(t, { q: 0, o: 0 });
    const e = byTitle.get(t)!;
    e.q += i.quantity;
    e.o += 1;
  }
  console.log("\norders per toy product:");
  for (const [t, v] of Array.from(byTitle.entries()).sort((a, b) => b[1].q - a[1].q))
    console.log(`  ${String(v.o).padStart(2)} orders / ${String(v.q).padStart(2)} qty | ${t}`);
  await p.$disconnect();
})();