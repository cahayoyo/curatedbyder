import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { BuyerTabs, OrderDTO } from "@/components/BuyerTabs";
import { ShoppingCart } from "lucide-react";

export default async function DashboardPage() {
  const session = await requireRole("USER");
  const userId = session.user.id;

  const orders = await db.order.findMany({
    where: { buyerId: userId },
    include: {
      items: {
        include: {
          book: { select: { title: true } },
          toy: { select: { title: true } },
        },
      },
    },
    orderBy: { soldAt: "desc" },
  });

  const dto: OrderDTO[] = orders.map((s) => ({
    id: s.id,
    invoiceNumber: s.invoiceNumber,
    status: s.status,
    paymentStatus: s.paymentStatus,
    total: s.total,
    soldAt: s.soldAt.toISOString(),
    dp: s.dp,
    remaining: s.remaining,
    eta: s.eta,
    items: s.items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      book: { title: i.book?.title ?? i.toy?.title ?? "—" },
    })),
  }));

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <ShoppingCart className="h-6 w-6 text-[#D97A7A]" />
        Pesanan Saya
      </h2>
      <BuyerTabs orders={dto} />
    </div>
  );
}