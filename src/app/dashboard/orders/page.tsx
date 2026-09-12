import { Suspense } from "react";
import Link from "next/link";
import { Prisma, PaymentStatus, OrderStatus } from "@prisma/client";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { withBuyer } from "@/lib/rls";
import { BuyerTabs, OrderDTO } from "@/components/BuyerTabs";
import { buyerOrderInclude, toBuyerOrderDTO } from "@/lib/orderDto";
import { SearchInput } from "@/components/SearchInput";
import { SortSelect } from "@/components/SortSelect";
import { BuyerFilter } from "@/components/BuyerFilter";
import { BuyerShell, PendingDim } from "@/components/BuyerShell";
import { OrderTabNav } from "@/components/OrderTabNav";
import { ListLoader } from "@/components/ListLoader";
import { PAYMENT_STATUSES, STATUSES } from "@/lib/orderOptions";
import { BUYER_DEFAULT_PAGE_SIZE, scalarize } from "@/lib/pagination";
import { ArrowLeft, ChevronRight, FileText, Truck, Wallet } from "lucide-react";

type DashboardSearchParams = {
  q?: string;
  batch?: string;
  status?: string;
  paymentStatus?: string;
  tab?: string;
  sort?: string;
  page?: string;
};

const TAB_KEYS = ["invoice", "payment", "shipment"] as const;

const TAB_META = {
  invoice: {
    crumb: "Invoice",
    title: "Invoice",
    subtitle: "Daftar invoice dari pesanan kamu di CuratedByDer.",
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
  const tab = (TAB_KEYS as readonly string[]).includes(sp?.tab ?? "")
    ? (sp!.tab as string)
    : "invoice";

  return (
    <BuyerShell>
      <div className="space-y-4 px-2 md:px-6">
        {/* Mobile: back arrow + generic title */}
        <div className="flex items-start gap-2 md:hidden">
          <Link
            href="/dashboard"
            aria-label="Kembali ke dashboard"
            className="mt-0.5 text-[#B85C5C] transition-colors hover:text-[#B04A4A]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold leading-tight">Pesanan Saya</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Kelola pesanan dan invoice kamu.</p>
          </div>
        </div>

        {/* Desktop: breadcrumb + per-tab title */}
        <div className="hidden md:block">
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

        <OrderTabNav basePath="/dashboard/orders" defaultTab={tab} />

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <SearchInput
              basePath="/dashboard/orders"
              placeholder="Cari invoice / judul buku / nomor invoice..."
              inputClassName="border-[#F0CBCB] bg-white"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <BuyerFilter
              basePath="/dashboard/orders"
              batches={batches}
              className="flex-1 md:flex-none"
            />
            <SortSelect
              basePath="/dashboard/orders"
              options={[
                { value: "desc", label: "Terbaru" },
                { value: "asc", label: "Terlama" },
              ]}
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
  const per = BUYER_DEFAULT_PAGE_SIZE;
  const sort = searchParams?.sort === "asc" ? "asc" : "desc";
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

  const { total, orders } = await withBuyer(userId, async (tx) => {
    const total = await tx.order.count({ where });

    const orders = await tx.order.findMany({
      where,
      include: buyerOrderInclude,
      orderBy: { soldAt: sort },
      skip: (page - 1) * per,
      take: per,
    });

    return { total, orders };
  });

  const dto: OrderDTO[] = orders.map(toBuyerOrderDTO);

  const paginationQuery = {
    q: searchParams?.q ?? "",
    batch: searchParams?.batch ?? "",
    status: searchParams?.status ?? "",
    paymentStatus: searchParams?.paymentStatus ?? "",
    tab: tab === "invoice" ? undefined : tab,
    sort: sort === "desc" ? undefined : sort,
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