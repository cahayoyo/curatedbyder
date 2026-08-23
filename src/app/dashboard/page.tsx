import { Suspense } from "react";
import { Prisma, PaymentStatus, OrderStatus } from "@prisma/client";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { BuyerTabs, OrderDTO } from "@/components/BuyerTabs";
import { SearchInput } from "@/components/SearchInput";
import { BuyerFilter } from "@/components/BuyerFilter";
import { BuyerDashLoader } from "@/components/BuyerDashLoader";
import { PAYMENT_STATUSES, STATUSES } from "@/lib/orderOptions";
import { ShoppingCart } from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    batch?: string;
    status?: string;
    paymentStatus?: string;
  };
}) {
  const session = await requireRole("USER");
  const userId = session.user.id;

  const batches = await db.batch.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <ShoppingCart className="h-6 w-6 text-[#D97A7A]" />
        Pesanan Saya
      </h2>

      <div className="flex items-start gap-2">
        <BuyerFilter basePath="/dashboard" batches={batches} />
        <div className="w-[70%] md:w-[80%]">
          <SearchInput
            basePath="/dashboard"
            placeholder="Cari invoice / batch / judul buku..."
          />
        </div>
      </div>

      <Suspense fallback={<BuyerDashLoader />}>
        <OrdersSection userId={userId} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrdersSection({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams: { q?: string; batch?: string; status?: string; paymentStatus?: string };
}) {
  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const batchId = searchParams?.batch?.trim();
  const status = searchParams?.status?.trim();
  const statusValid = STATUSES.some((opt) => opt.value === status) ? status : undefined;
  const paymentStatuses = (searchParams?.paymentStatus ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => PAYMENT_STATUSES.some((opt) => opt.value === s));

  const where: Prisma.OrderWhereInput = { buyerId: userId };
  if (q) {
    where.OR = [
      { invoiceNumber: { contains: q, mode: "insensitive" as const } },
      { batch: { name: { contains: q, mode: "insensitive" as const } } },
      { items: { some: { book: { title: { contains: q, mode: "insensitive" as const } } } } },
      { items: { some: { toy: { title: { contains: q, mode: "insensitive" as const } } } } },
    ];
  }
  if (batchId) {
    where.batchId = batchId;
  }
  if (statusValid) {
    where.status = statusValid as OrderStatus;
  }
  if (paymentStatuses.length > 0) {
    where.paymentStatus = { in: paymentStatuses as PaymentStatus[] };
  }

  const orders = await db.order.findMany({
    where,
    include: {
      buyer: { select: { name: true, phone: true, contact: true } },
      batch: { select: { name: true } },
      items: {
        include: {
          book: { select: { title: true, formats: true } },
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
    shippingCost: s.shippingCost,
    trackingNumber: s.trackingNumber,
    batchName: s.batch?.name ?? null,
    buyerName: s.buyer.name,
    buyerPhone: s.buyer.phone,
    buyerContact: s.buyer.contact,
    items: s.items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.quantity * i.unitPrice,
      kind: i.book ? "BUKU" : i.toy ? "MAINAN" : "LAINNYA",
      book: {
        title: i.book?.title ?? i.toy?.title ?? "—",
        formats: i.book?.formats ?? [],
      },
    })),
  }));

  return <BuyerTabs orders={dto} />;
}