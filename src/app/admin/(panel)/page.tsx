import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { LayoutDashboard, Users, PackageSearch, TrendingUp, ShoppingCart } from "lucide-react";

export default async function AdminOverviewPage() {
  const [orders, buyers] = await Promise.all([
    db.order.findMany({
      include: {
        buyer: { select: { name: true } },
        items: { include: { book: { select: { title: true } } } },
      },
      orderBy: { soldAt: "desc" },
      take: 200,
    }),
    db.user.count({ where: { role: "USER" } }),
  ]);

  const soldByBook = new Map<string, { title: string; qty: number }>();
  for (const s of orders) {
    for (const it of s.items) {
      const cur = soldByBook.get(it.book.title) ?? { title: it.book.title, qty: 0 };
      cur.qty += it.quantity;
      soldByBook.set(it.book.title, cur);
    }
  }
  const bestSellers = Array.from(soldByBook.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const bySource = new Map<string, number>();
  for (const s of orders) {
    bySource.set(s.source, (bySource.get(s.source) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <LayoutDashboard className="h-6 w-6" />
        Overview
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Total buyer
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-bold">{buyers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShoppingCart className="h-4 w-4" />
              Total orders
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-bold">{orders.length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Best-selling books
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {bestSellers.map((b) => (
              <li key={b.title} className="flex justify-between">
                <span>{b.title}</span>
                <span className="font-medium">{b.qty} sold</span>
              </li>
            ))}
            {bestSellers.length === 0 && <li className="text-muted-foreground">No orders yet.</li>}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <PackageSearch className="h-4 w-4" />
            Orders by source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {Array.from(bySource.entries()).map(([c, n]) => (
              <li key={c} className="flex justify-between">
                <span>{c}</span>
                <span className="font-medium">{n}</span>
              </li>
            ))}
            {bySource.size === 0 && <li className="text-muted-foreground">No orders yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}