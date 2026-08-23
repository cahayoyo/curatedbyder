import { db } from "@/lib/db";
import { LayoutDashboard, Users, TrendingUp, ShoppingCart, BookOpen } from "lucide-react";

export default async function AdminOverviewPage() {
  const [totalOrders, buyers, totalBooks, bestSellerRows] =
    await Promise.all([
      db.order.count(),
      db.user.count({ where: { role: "USER" } }),
      db.book.count(),
      db.orderItem.groupBy({
        by: ["bookId"],
        where: { bookId: { not: null } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

  const bestSellerTitles: Record<string, string> = {};
  if (bestSellerRows.length > 0) {
    const bestIds = bestSellerRows
      .map((b) => b.bookId)
      .filter((id): id is string => id != null);
    const books = await db.book.findMany({
      where: { id: { in: bestIds } },
      select: { id: true, title: true },
    });
    for (const b of books) bestSellerTitles[b.id] = b.title;
  }

  const bestSellers = bestSellerRows
    .filter((b) => b.bookId != null)
    .map((b) => ({
      id: b.bookId as string,
      title: bestSellerTitles[b.bookId as string] ?? "Unknown",
      qty: b._sum.quantity ?? 0,
    }))
    .filter((b) => b.qty > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <LayoutDashboard className="h-6 w-6" />
        Overview
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
Total Pembeli
            </p>
          <p className="text-2xl font-bold">{buyers}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            Total Pesanan
          </p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            Total Buku
          </p>
          <p className="text-2xl font-bold">{totalBooks}</p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <TrendingUp className="h-4 w-4" />
          Buku Best Seller
        </p>
        <ul className="space-y-1 text-sm">
          {bestSellers.map((b) => (
            <li key={b.id} className="flex justify-between">
              <span>{b.title}</span>
              <span className="font-medium">{b.qty} sold</span>
            </li>
          ))}
          {bestSellers.length === 0 && <li className="text-muted-foreground">No orders yet.</li>}
        </ul>
      </div>
    </div>
  );
}