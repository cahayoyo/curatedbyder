import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export default async function AdminOverviewPage() {
  const [sales, buyers] = await Promise.all([
    db.sale.findMany({
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
  for (const s of sales) {
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
  for (const s of sales) {
    bySource.set(s.source, (bySource.get(s.source) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Overview</h2>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total buyer</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-bold">{buyers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total sales</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-bold">{sales.length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Best-selling books</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {bestSellers.map((b) => (
              <li key={b.title} className="flex justify-between">
                <span>{b.title}</span>
                <span className="font-medium">{b.qty} sold</span>
              </li>
            ))}
            {bestSellers.length === 0 && <li className="text-muted-foreground">No sales yet.</li>}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales by source</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {Array.from(bySource.entries()).map(([c, n]) => (
              <li key={c} className="flex justify-between">
                <span>{c}</span>
                <span className="font-medium">{n}</span>
              </li>
            ))}
            {bySource.size === 0 && <li className="text-muted-foreground">No sales yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}