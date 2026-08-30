import { Suspense } from "react";
import { Prisma, PaymentStatus, OrderStatus } from "@prisma/client";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { BuyerTabs, OrderDTO } from "@/components/BuyerTabs";
import { SearchInput } from "@/components/SearchInput";
import { PageSizeSelect } from "@/components/PageSizeSelect";
import { BuyerFilter } from "@/components/BuyerFilter";
import { BuyerShell, PendingDim } from "@/components/BuyerShell";
import { ListLoader } from "@/components/ListLoader";
import { PAYMENT_STATUSES, STATUSES } from "@/lib/orderOptions";
import { parsePerPage, perQuery } from "@/lib/pagination";
import { ShoppingCart } from "lucide-react";

type DashboardSearchParams = {
  q?: string;
  batch?: string;
  status?: string;
  paymentStatus?: string;
  tab?: string;
  page?: string;
  per?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  const session = await requireRole("USER");
  const userId = session.user.id;

  const batches = await db.batch.findMany({
    where: { items: { some: { order: { buyerId: userId } } } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <BuyerShell>
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <ShoppingCart className="h-6 w-6 text-[#D97A7A]" />
          Pesanan Saya
        </h2>

        <div className="flex items-start gap-2">
          <BuyerFilter basePath="/dashboard" batches={batches} />
          <div className="flex w-[70%] items-center gap-2 md:w-[80%]">
            <div className="w-full">
              <SearchInput
                basePath="/dashboard"
                placeholder="Cari invoice / batch / judul buku..."
              />
            </div>
            <PageSizeSelect basePath="/dashboard" />
          </div>
        </div>

        <PendingDim>
          <Suspense fallback={<ListLoader label="Memuat pesanan..." />}>
            <OrdersSection userId={userId} searchParams={searchParams} />
          </Suspense>
        </PendingDim>
      </div>
    </BuyerShell>
  );
}

async function OrdersSection({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams: DashboardSearchParams;
}) {
  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const batchId = searchParams?.batch?.trim();
  const status = searchParams?.status?.trim();
  const statusValid = STATUSES.some((opt) => opt.value === status) ? status : undefined;
  const paymentStatuses = (searchParams?.paymentStatus ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => PAYMENT_STATUSES.some((opt) => opt.value === s));
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const per = parsePerPage(searchParams?.per);
  const tab = ["invoice", "payment", "shipment"].includes(searchParams?.tab ?? "")
    ? searchParams.tab!
    : "invoice";

  const where: Prisma.OrderWhereInput = { buyerId: userId };
  if (q) {
    where.OR = [
      { invoiceNumber: { contains: q, mode: "insensitive" as const } },
      { items: { some: { batch: { name: { contains: q, mode: "insensitive" as const } } } } },
      { items: { some: { book: { title: { contains: q, mode: "insensitive" as const } } } } },
      { items: { some: { toy: { title: { contains: q, mode: "insensitive" as const } } } } },
    ];
  }
  if (batchId) {
    where.items = { some: { batchId } };
  }
  if (statusValid) {
    where.items = { some: { status: statusValid as OrderStatus } };
  }
  if (paymentStatuses.length > 0) {
    where.paymentStatus = { in: paymentStatuses as PaymentStatus[] };
  }

  const total = await db.order.count({ where });

  const orders = await db.order.findMany({
    where,
    include: {
      buyer: { select: { name: true, phone: true, contact: true } },
      items: {
        orderBy: { id: "asc" },
        include: {
          batch: { select: { name: true } },
          book: { select: { title: true, formats: true } },
          toy: { select: { title: true } },
        },
      },
    },
    orderBy: { soldAt: "desc" },
    skip: (page - 1) * per,
    take: per,
  });

  const dto: OrderDTO[] = orders.map((s) => ({
    id: s.id,
    invoiceNumber: s.invoiceNumber,
    paymentStatus: s.paymentStatus,
    total: s.total,
    soldAt: s.soldAt.toISOString(),
    dp: s.dp,
    remaining: s.remaining ?? Math.max(0, s.total - (s.dp ?? 0)),
    shippingCost: s.shippingCost,
    trackingNumber: s.trackingNumber,
    buyerName: s.buyer.name,
    buyerPhone: s.buyer.phone,
    buyerContact: s.buyer.contact,
    items: s.items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.quantity * i.unitPrice,
      status: i.status,
      batchId: i.batchId,
      batchName: i.batch?.name ?? null,
      eta: i.eta,
      kind: i.book ? "BUKU" : i.toy ? "MAINAN" : "LAINNYA",
      book: {
        title: i.book?.title ?? i.toy?.title ?? "—",
        formats: i.book?.formats ?? [],
      },
    })),
  }));

  const paginationQuery = {
    q: searchParams?.q ?? "",
    batch: searchParams?.batch ?? "",
    status: searchParams?.status ?? "",
    paymentStatus: searchParams?.paymentStatus ?? "",
    tab: tab === "invoice" ? undefined : tab,
    per: perQuery(per),
  };

  return (
    <BuyerTabs
      orders={dto}
      total={total}
      page={page}
      pageSize={per}
      basePath="/dashboard"
      query={paginationQuery}
      defaultTab={tab}
    />
  );
}