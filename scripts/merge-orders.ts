import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();
const BACKUP_DIR = "C:/Users/cahay/AppData/Local/Temp/opencode";
const backupFile = path.join(BACKUP_DIR, `orders-backup-${Date.now()}.json`);

async function main() {
  const oldOrders = await db.order.findMany({
    include: { items: { select: { bookId: true, quantity: true, unitPrice: true, subtotal: true } } },
    orderBy: { invoiceNumber: "asc" },
  });
  fs.writeFileSync(backupFile, JSON.stringify(oldOrders, null, 2), "utf-8");
  console.log(`Backup -> ${backupFile} (${oldOrders.length} orders)`);

  const groups = new Map<string, typeof oldOrders>();
  for (const o of oldOrders) {
    const key = `${o.buyerId}|${o.batchId}|${o.eta}`;
    const list = groups.get(key) ?? [];
    list.push(o);
    groups.set(key, list);
  }

  let created = 0;
  let deleted = 0;

  for (const g of Array.from(groups.values())) {
    if (g.length === 1) continue;
    const sorted = [...g].sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber));
    const keeper = sorted[0];

    // merge items by (bookId, unitPrice)
    const itemMap = new Map<string, { bookId: string; unitPrice: number; quantity: number; subtotal: number }>();
    for (const o of g) {
      for (const it of o.items) {
        const k = `${it.bookId}|${it.unitPrice}`;
        const cur = itemMap.get(k);
        if (cur) {
          cur.quantity += it.quantity;
          cur.subtotal += it.subtotal;
        } else {
          itemMap.set(k, { bookId: it.bookId ?? "", unitPrice: it.unitPrice, quantity: it.quantity, subtotal: it.subtotal });
        }
      }
    }
    const mergedItems = Array.from(itemMap.values());

    const total = mergedItems.reduce((acc, i) => acc + i.subtotal, 0);
    const dp = g.reduce((acc, o) => acc + (o.dp ?? 0), 0);
    const shippingCost = g.reduce((acc, o) => acc + (o.shippingCost ?? 0), 0);
    const trackingNumber = g.map((o) => o.trackingNumber).find((t) => t) ?? null;
    const soldAt = sorted[0].soldAt;

    const paymentStatus = (() => {
      if (total === 0 && dp === 0) return "LUNAS";
      if (dp >= total) return "LUNAS";
      if (dp > 0 && dp < total) return "DONE_DP";
      return "NO_PAYMENT";
    })();
    const remaining = dp > 0 ? Math.max(0, total - dp) : null;

    await db.order.update({
      where: { id: keeper.id },
      data: {
        total,
        dp,
        remaining,
        shippingCost,
        trackingNumber,
        paymentStatus,
        items: {
          deleteMany: {},
          create: mergedItems.map((i) => ({
            bookId: i.bookId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.subtotal,
          })),
        },
      },
    });

    for (const o of g) {
      if (o.id === keeper.id) continue;
      await db.order.delete({ where: { id: o.id } });
      deleted++;
    }
    created++;
  }

  const remainingOrders = await db.order.count();
  console.log(`\nMerged groups: ${created}`);
  console.log(`Deleted orders: ${deleted}`);
  console.log(`Remaining orders: ${remainingOrders}`);

  const dupeCheck = await db.order.findMany({
    select: { buyerId: true, batchId: true, eta: true },
  });
  const seen = new Map<string, number>();
  let dupLeft = 0;
  for (const d of dupeCheck) {
    const k = `${d.buyerId}|${d.batchId}|${d.eta}`;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  seen.forEach((n) => { if (n > 1) { dupLeft++; console.log(`  WARNING still multi: ${n}`); } });
  console.log(`Groups still duplicated: ${dupLeft}`);
}

main().catch((e) => { console.error(e); process.exit(1); });