import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { BuyerTabs, SaleDTO } from "@/components/BuyerTabs";

export default async function DashboardPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const sales = await db.sale.findMany({
    where: { buyerId: userId },
    include: {
      items: { include: { book: { select: { title: true } } } },
    },
    orderBy: { soldAt: "desc" },
  });

  const dto: SaleDTO[] = sales.map((s) => ({
    id: s.id,
    invoiceNumber: s.invoiceNumber,
    source: s.source,
    status: s.status,
    paymentStatus: s.paymentStatus,
    total: s.total,
    soldAt: s.soldAt.toISOString(),
    dp: s.dp,
    remaining: s.remaining,
    eta: s.eta,
    format: s.format,
    items: s.items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      book: { title: i.book.title },
    })),
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Orders</h2>
      <BuyerTabs sales={dto} />
    </div>
  );
}