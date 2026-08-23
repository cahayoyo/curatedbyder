import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const fixed = [];
  const items = await p.order.findMany({
    where: { invoiceNumber: { contains: "--" } },
    select: { id: true, invoiceNumber: true },
  });
  for (const o of items) {
    const next = o.invoiceNumber.replace(/--/g, "-");
    await p.order.update({ where: { id: o.id }, data: { invoiceNumber: next } });
    fixed.push(`${o.invoiceNumber} -> ${next}`);
  }
  console.log("fixed:", fixed.length);
  for (const f of fixed) console.log("  ", f);
  const dup = await p.order.groupBy({ by: ["invoiceNumber"], _count: { _all: true } });
  const dups = dup.filter((d) => d._count._all > 1);
  console.log("duplicate invoices after fix:", dups.length);
  await p.$disconnect();
})();