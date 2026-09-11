import { Suspense } from "react";
import Link from "next/link";
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
import { BUYER_DEFAULT_PAGE_SIZE, parsePerPage, perQuery, scalarize } from "@/lib/pagination";
import { ChevronRight, FileText, Truck, Wallet } from "lucide-react";

type DashboardSearchParams = {
  q?: string;
  batch?: string;
  status?: string;
  paymentStatus?: string;
  tab?: string;
  page?: string;
  per?: string;
};

const TAB_KEYS = ["invoice", "payment", "shipment"] as const;

const TAB_META = {
  invoice: {
    crumb: "Invoice",
    title: "Pesanan Saya",
    subtitle: "Semua invoice dan pesananmu ada di sini.",
    icon: FileText,
  },
  payment: {
    crumb: "Pembayaran",
    title: "Pembayaran",
    subtitle: "Pantau status pembayaran pesananmu.",
    icon: Wallet,
  },
  shipment: {
    crumb: "Lacak Pesanan",
    title: "Lacak Pesanan",
    subtitle: "Pantau perjalanan buku dan pesananmu.",
    icon: Truck,
  },
} as const;

function tabMeta(v: string | undefined) {
  return TAB_META[
    (TAB_KEYS as readonly string[]).includes(v ?? "") ? (v as keyof typeof TAB_META) : "invoice"
  ];
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const sp = scalarize(await searchParams, ["paymentStatus"]) as DashboardSearchParams;
  const session = await requireRole("USER");
  const userId = session.user.id;

  const batches = await db.batch.findMany({
    where: { items: { some: { order: { buyerId: userId } } } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const meta = tabMeta(sp?.tab);
  const TabIcon = meta.icon;

  return (
    <BuyerShell>
      <div className="space-y-4">
        <div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/dashboard/orders" className="transition-colors hover:text-[#D97A7A]">
              Pesanan
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-[#B04A4A]">{meta.crumb}</span>
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <TabIcon className="h-6 w-6 text-[#D97A7A]" />
            {meta.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{meta.subtitle}</p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <SearchInput
              basePath="/dashboard/orders"
              placeholder="Cari Invoice / Judul Buku..."
              inputClassName="bg-white"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <BuyerFilter
              basePath="/dashboard/orders"
              batches={batches}
              className="flex-1 md:flex-none"
            />
            <PageSizeSelect
              basePath="/dashboard/orders"
              defaultPer={BUYER_DEFAULT_PAGE_SIZE}
              suffix="per halaman"
            />
          </div>
        </div>

        <PendingDim>
          <Suspense fallback={<ListLoader label="Memuat pesanan..." />}>
            <OrdersSection userId={userId} searchParams={sp} />
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
  const per = parsePerPage(searchParams?.per, BUYER_DEFAULT_PAGE_SIZE);
  const tab = (TAB_KEYS as readonly string[]).includes(searchParams?.tab ?? "")
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
          book: { select: { title: true, formats: true, image: true } },
          toy: { select: { title: true, image: true } },
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
      image: i.book?.image ?? i.toy?.image ?? null,
      stages: [
        i.placedAt,
        i.shippingToIndonesiaAt,
        i.arrivedInIndonesiaAt,
        i.arrivedAtWarehouseAt,
        i.shippedToCustomerAt,
        i.deliveredAt,
      ].map((d) => d?.toISOString() ?? null),
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
    per: perQuery(per, BUYER_DEFAULT_PAGE_SIZE),
  };

  return (
    <BuyerTabs
      orders={dto}
      total={total}
      page={page}
      pageSize={per}
      basePath="/dashboard/orders"
      query={paginationQuery}
      defaultTab={tab}
    />
  );
}