import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { getBatches } from "@/server/queries/catalog";
import { Fragment, Suspense } from "react";
import { Prisma, PaymentStatus, OrderStatus, Eta } from "@prisma/client";
import { StatusSelect, PaymentStatusSelect } from "@/components/OrderRow";
import { NavActionButton } from "@/components/NavActionButton";
import { ManageBatchDialog } from "@/components/ManageBatchDialog";
import { SearchInput } from "@/components/SearchInput";
import { PageSizeSelect } from "@/components/PageSizeSelect";
import { deleteOrder } from "@/server/actions/orders";
import { Pagination } from "@/components/Pagination";
import { ETAS, STATUSES, PAYMENT_STATUSES, etaLabel, FORMAT_BADGE } from "@/lib/orderOptions";
import { formatIDR } from "@/lib/format";
import { OrderCard } from "@/components/OrderCard";
import { OrderSummaryAccordion, type OrderSummaryDTO } from "@/components/OrderSummaryAccord";
import { OrderActionsMenu } from "@/components/OrderActionsMenu";
import { OrderFilter } from "@/components/OrderFilter";
import { SortButton } from "@/components/SortButton";
import { ListLoader } from "@/components/ListLoader";
import { parsePerPage, perQuery, scalarize } from "@/lib/pagination";
import { Plus, ShoppingCart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function effectiveRemaining(s: { remaining: number | null; dp: number | null; total: number }) {
  return s.remaining ?? Math.max(0, s.total - (s.dp ?? 0));
}

type OrderSearchParams = {
  q?: string;
  page?: string;
  per?: string;
  paymentStatus?: string;
  status?: string;
  batch?: string;
  eta?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  dir?: string;
};

const orderInclude = {
  buyer: { select: { id: true, name: true, username: true, phone: true, contact: true } },
  payments: { select: { amount: true }, orderBy: { createdAt: "asc" } },
  items: {
    orderBy: { id: "asc" },
    include: {
      batch: { select: { id: true, name: true } },
      book: {
        select: {
          title: true,
          formats: true,
          status: true,
          batchPrices: { select: { batchId: true, formats: true } },
        },
      },
      toy: {
        select: {
          title: true,
          status: true,
        },
      },
    },
  },
} as const;

type OrderItemDTO = {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  status: string;
  batchId: string;
  batchName: string | null;
  eta: Eta;
  kind?: "BUKU" | "MAINAN" | "LAINNYA";
  book: {
    title: string;
    formats: string[];
    status: "READY_STOCK" | "PRE_ORDER";
  };
};

type ItemOrToy = {
  book: { title: string; formats: string[]; status: "READY_STOCK" | "PRE_ORDER"; batchPrices: { batchId: string; formats: string[] }[] } | null;
  toy: { title: string; status: "READY_STOCK" | "PRE_ORDER" } | null;
};

function itemTitle(it: ItemOrToy): string {
  return it.book?.title ?? it.toy?.title ?? "—";
}

function itemFormats(it: ItemOrToy & { batchId?: string }): string[] {
  if (it.toy) return [];
  const src = it.book;
  if (!src) return [];
  const bp = src.batchPrices.find((x) => x.batchId === it.batchId);
  return bp ? bp.formats : src.formats;
}

function itemStatus(it: ItemOrToy): "READY_STOCK" | "PRE_ORDER" {
  return it.book?.status ?? it.toy?.status ?? "PRE_ORDER";
}

function itemKind(it: ItemOrToy): "BUKU" | "MAINAN" | "LAINNYA" {
  if (it.book) return "BUKU";
  if (it.toy) return "MAINAN";
  return "LAINNYA";
}

function ProductLabel({ it }: { it: ItemOrToy }) {
  const kind = itemKind(it);
  if (kind === "BUKU")
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-sky-300 bg-sky-100 px-1.5 text-[10px] font-semibold text-sky-800">
        Buku
      </span>
    );
  if (kind === "MAINAN")
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-amber-300 bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">
        Mainan
      </span>
    );
  return null;
}

function toItemDTO(
  it: ItemOrToy & {
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    status: string;
    batchId: string;
    eta: Eta;
    batch: { id: string; name: string } | null;
  }
): OrderItemDTO {
  return {
    id: it.id,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    subtotal: it.subtotal,
    status: it.status,
    batchId: it.batchId,
    batchName: it.batch?.name ?? null,
    eta: it.eta,
    kind: itemKind(it),
    book: {
      title: itemTitle(it),
      formats: itemFormats(it),
      status: itemStatus(it),
    },
  };
}

function orderByClause(
  s: "batch" | "eta" | "name" | "invoice" | "total" | "dp" | "remaining" | undefined,
  d: "asc" | "desc"
): Prisma.OrderOrderByWithRelationInput {
  switch (s) {
    case "name":
      return { buyer: { name: d } };
    case "invoice":
      return { createdAt: d };
    case "total":
      return { total: d };
    case "dp":
      return { dp: d };
    case "remaining":
      return { remaining: d };
    default:
      return { createdAt: "desc" };
  }
}

async function OrdersList({
  searchParams,
}: {
  searchParams: OrderSearchParams;
}) {
  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const qRaw = (searchParams?.q ?? "").trim();
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const per = parsePerPage(searchParams?.per);

  const sort = searchParams?.sort?.trim();
  const sortValid = ["batch", "eta", "name", "book", "invoice", "price", "total", "dp", "remaining"].includes(sort ?? "")
    ? (sort as "batch" | "eta" | "name" | "book" | "invoice" | "price" | "total" | "dp" | "remaining")
    : undefined;
  const dir = searchParams?.dir?.trim() === "desc" ? ("desc" as const) : ("asc" as const);

  const orderBy = orderByClause(
    sortValid && sortValid !== "book" && sortValid !== "price" ? sortValid : undefined,
    dir
  );

  const paymentStatuses = (searchParams?.paymentStatus ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => PAYMENT_STATUSES.some((p) => p.value === s));
  const status = searchParams?.status?.trim();
  const statusValid = STATUSES.some((p) => p.value === status) ? status : undefined;
  const batchId = searchParams?.batch?.trim();
  const eta = searchParams?.eta?.trim();
  const etaValid = ETAS.some((e) => e.value === eta) ? eta : undefined;

  const dateFrom = (() => {
    const v = searchParams?.dateFrom?.trim();
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const d = new Date(`${v}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  })();
  const dateTo = (() => {
    const v = searchParams?.dateTo?.trim();
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const d = new Date(`${v}T23:59:59.999`);
    return Number.isNaN(d.getTime()) ? null : d;
  })();

  const where: Prisma.OrderWhereInput = {};
  if (q) {
    where.OR = [
      { invoiceNumber: { contains: q, mode: "insensitive" as const } },
      { buyer: { name: { contains: q, mode: "insensitive" as const } } },
      { items: { some: { book: { title: { contains: q, mode: "insensitive" as const } } } } },
      { items: { some: { toy: { title: { contains: q, mode: "insensitive" as const } } } } },
    ];
  }
  if (paymentStatuses.length > 0) {
    where.paymentStatus = { in: paymentStatuses as PaymentStatus[] };
  }
  const itemWhere: Prisma.OrderItemWhereInput = {};
  if (statusValid) {
    itemWhere.status = statusValid as OrderStatus;
  }
  if (batchId) {
    itemWhere.batchId = batchId;
  }
  if (etaValid) {
    itemWhere.eta = etaValid as Eta;
  }
  if (Object.keys(itemWhere).length > 0) {
    where.items = { some: itemWhere };
  }
  if (dateFrom || dateTo) {
    where.soldAt = {};
    if (dateFrom) where.soldAt.gte = dateFrom;
    if (dateTo) where.soldAt.lte = dateTo;
  }

  const totalFiltered = await db.order.count({ where });

  let orders;
  if (sortValid === "book" || sortValid === "price") {
    const all = await db.order.findMany({ where, include: orderInclude });
    const dirFactor = dir === "asc" ? 1 : -1;
    all.sort((a, b) => {
      if (sortValid === "book") {
        const ta = a.items[0] ? itemTitle(a.items[0]) : "";
        const tb = b.items[0] ? itemTitle(b.items[0]) : "";
        return ta.localeCompare(tb, undefined, { sensitivity: "base" }) * dirFactor;
      }
      const pa = a.items[0]?.unitPrice ?? 0;
      const pb = b.items[0]?.unitPrice ?? 0;
      return (pa - pb) * dirFactor;
    });
    orders = all.slice((page - 1) * per, page * per);
  } else {
    orders = await db.order.findMany({
      where,
      include: orderInclude,
      orderBy,
      skip: (page - 1) * per,
      take: per,
    });
  }

  const pageQuery = {
    q: qRaw,
    paymentStatus: searchParams?.paymentStatus ?? "",
    status: searchParams?.status ?? "",
    batch: searchParams?.batch ?? "",
    eta: searchParams?.eta ?? "",
    dateFrom: searchParams?.dateFrom ?? "",
    dateTo: searchParams?.dateTo ?? "",
    per: perQuery(per),
  };

  return (
    <>
      {/* Mobile: card layout */}
      <div className="space-y-3 md:hidden">
        {orders.map((s) => (
          <OrderCard
            key={s.id}
            order={{
              id: s.id,
              invoiceNumber: s.invoiceNumber,
              soldAt: s.soldAt,
              total: s.total,
              dp: s.dp,
              remaining: effectiveRemaining(s),
              shippingCost: s.shippingCost,
              trackingNumber: s.trackingNumber,
              paymentStatus: s.paymentStatus,
              buyer: s.buyer,
              items: s.items.map((it) => toItemDTO(it)),
              payments: s.payments.map((p) => ({ amount: p.amount })),
            }}
            onDelete={deleteOrder.bind(null, s.id)}
          />
        ))}
        {orders.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            Belum ada pesanan.
          </div>
        )}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden overflow-x-auto rounded-xl border border-[#F0CBCB]/60 md:block">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-b border-input hover:bg-transparent" style={{ backgroundColor: "#F3CFCF" }}>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1"><SortButton label="Invoice" column="invoice" type="num" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1">Status Pembayaran</span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1"><SortButton label="Nama" column="name" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1"><SortButton label="Nama Produk" column="book" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1">Qty</span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1"><SortButton label="Harga" column="price" type="num" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1">Batch</span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1">ETA</span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1">Status Item</span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1"><SortButton label="Total" column="total" type="num" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1"><SortButton label="DP" column="dp" type="num" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1"><SortButton label="Sisa Tagihan" column="remaining" type="num" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1">Ongkir</span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1">Aksi</span>
                </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((s) => (
              <Fragment key={s.id}>
                <TableRow className="border-b border-input last:border-0">
                  <TableCell className="font-mono font-medium" rowSpan={s.items.length}>{s.invoiceNumber}</TableCell>
                  <TableCell rowSpan={s.items.length}>
                    <PaymentStatusSelect orderId={s.id} current={s.paymentStatus} />
                  </TableCell>
                  <TableCell rowSpan={s.items.length}>{s.buyer.name}</TableCell>
                  <TableCell>
                    <span className="flex flex-col items-start gap-1">
                      <span>{s.items[0] ? itemTitle(s.items[0]) : "—"}</span>
                      <span className="flex flex-wrap items-center gap-1">
                        <ProductLabel it={s.items[0]} />
                        {itemFormats(s.items[0]).map((f) => (
                          <span
                            key={f}
                            className={`inline-flex h-4 items-center rounded-full border px-1.5 text-[10px] font-medium leading-none ${FORMAT_BADGE[f] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
                          >
                            {f}
                          </span>
                        ))}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{s.items[0].quantity}</TableCell>
                  <TableCell>{formatIDR(s.items[0].unitPrice)}</TableCell>
                  <TableCell>{s.items[0].batch?.name || "—"}</TableCell>
                  <TableCell>{etaLabel(s.items[0].eta)}</TableCell>
                  <TableCell>
                    <StatusSelect itemId={s.items[0].id} current={s.items[0].status} />
                  </TableCell>
                  <TableCell className="border-l border-input" rowSpan={s.items.length}>{formatIDR(s.total)}</TableCell>
                  <TableCell className="border-l border-input" rowSpan={s.items.length}>{formatIDR(s.dp)}</TableCell>
                  <TableCell className="border-l border-input" rowSpan={s.items.length}>{formatIDR(effectiveRemaining(s))}</TableCell>
                  <TableCell className="border-l border-input" rowSpan={s.items.length}>{s.shippingCost != null ? formatIDR(s.shippingCost) : "--"}</TableCell>
                  <TableCell className="border-l border-input" rowSpan={s.items.length}>
                    <OrderActionsMenu
                      order={{
                        id: s.id,
                        invoiceNumber: s.invoiceNumber,
                        soldAt: s.soldAt,
                        total: s.total,
                        dp: s.dp,
                        remaining: effectiveRemaining(s),
                        shippingCost: s.shippingCost,
                        trackingNumber: s.trackingNumber,
                        paymentStatus: s.paymentStatus,
                        buyer: s.buyer,
                        items: s.items.map((it) => toItemDTO(it)),
                        payments: s.payments.map((p) => ({ amount: p.amount })),
                      }}
                      onDelete={deleteOrder.bind(null, s.id)}
                      deleteSuccessMessage={`${s.invoiceNumber} berhasil dihapus!`}
                    />
                  </TableCell>
                </TableRow>
                {s.items.slice(1).map((it, i) => (
                  <TableRow key={`${s.id}-item-${i}`} className="border-b border-input last:border-0">
                    <TableCell>
                    <span className="flex flex-col items-start gap-1">
                      <span>{itemTitle(it)}</span>
                      <span className="flex flex-wrap items-center gap-1">
                        <ProductLabel it={it} />
                        {itemFormats(it).map((f) => (
                          <span
                            key={f}
                            className={`inline-flex h-4 items-center rounded-full border px-1.5 text-[10px] font-medium leading-none ${FORMAT_BADGE[f] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
                          >
                            {f}
                          </span>
                        ))}
                      </span>
                    </span>
                  </TableCell>
                    <TableCell className="text-center">{it.quantity}</TableCell>
                    <TableCell>{formatIDR(it.unitPrice)}</TableCell>
                    <TableCell>{it.batch?.name || "—"}</TableCell>
                    <TableCell>{etaLabel(it.eta)}</TableCell>
                    <TableCell>
                      <StatusSelect itemId={it.id} current={it.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={14} className="text-center text-muted-foreground">
                  Belum ada pesanan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mx-auto">
        <Pagination
          total={totalFiltered}
          page={page}
          pageSize={per}
          basePath="/admin/orders"
          query={{
            ...pageQuery,
            sort: sortValid ?? "",
            dir: searchParams?.dir?.trim() === "desc" ? "desc" : "",
          }}
        />
      </div>
    </>
  );
}

async function OrdersSummary() {
  const [batches, orders, byBatch, byEta, byPayment, byStatus] =
    await Promise.all([
      getBatches(),
      db.order.findMany({ select: { createdAt: true, total: true } }),
      db.orderItem.groupBy({ by: ["batchId"], _count: { _all: true }, _sum: { subtotal: true } }),
      db.orderItem.groupBy({ by: ["eta"], _count: { _all: true }, _sum: { subtotal: true } }),
      db.order.groupBy({ by: ["paymentStatus"], _count: { _all: true }, _sum: { total: true } }),
      db.orderItem.groupBy({ by: ["status"], _count: { _all: true }, _sum: { subtotal: true } }),
    ]);

  const grandTotalByMonth = new Array<number>(12).fill(0);
  let grandTotal = 0;
  for (const o of orders) {
    grandTotal += o.total;
    grandTotalByMonth[o.createdAt.getMonth()] += o.total;
  }

  const batchMap = new Map(byBatch.map((b) => [b.batchId, b]));
  const etaMap = new Map(byEta.map((e) => [e.eta, e]));
  const paymentMap = new Map(byPayment.map((p) => [p.paymentStatus, p]));
  const statusMap = new Map(byStatus.map((s) => [s.status, s]));

  const summaryData: OrderSummaryDTO = {
    totalOrders: orders.length,
    grandTotal,
    grandTotalByMonth,
    byBatch: batches.map((b) => ({
      value: b.id,
      label: b.name,
      count: batchMap.get(b.id)?._count._all ?? 0,
      total: batchMap.get(b.id)?._sum.subtotal ?? 0,
    })),
    byEta: ETAS.map((e) => ({
      value: e.value,
      label: e.label,
      count: etaMap.get(e.value)?._count._all ?? 0,
      total: etaMap.get(e.value)?._sum.subtotal ?? 0,
    })),
    byPayment: PAYMENT_STATUSES.map((p) => ({
      value: p.value,
      label: p.label,
      count: paymentMap.get(p.value)?._count._all ?? 0,
      total: paymentMap.get(p.value)?._sum.total ?? 0,
    })),
    byStatus: STATUSES.map((s) => ({
      value: s.value,
      label: s.label,
      count: statusMap.get(s.value)?._count._all ?? 0,
      total: statusMap.get(s.value)?._sum.subtotal ?? 0,
    })),
  };

  return <OrderSummaryAccordion {...summaryData} />;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrderSearchParams>;
}) {
  await requireRole("SUPER_ADMIN");
  const sp = scalarize(await searchParams, ["paymentStatus"]) as OrderSearchParams;
  const batches = await getBatches();

  return (
    <div className="space-y-4 [--border:0_55%_87%] [--input:0_55%_87%]">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <ShoppingCart className="h-6 w-6" />
            List Pesanan
          </h2>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
            <ManageBatchDialog batches={batches} />
            <NavActionButton
              href="/admin/orders/new"
              icon={<Plus className="h-4 w-4" />}
              className="h-9 w-full border border-[#D97A7A] bg-[#D97A7A] px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#c96666] hover:text-white sm:w-40"
            >
              Tambah Pesanan
            </NavActionButton>
          </div>
        </div>

        <Suspense fallback={<ListLoader compact label="Memuat ringkasan..." />}>
          <OrdersSummary />
        </Suspense>

        <div className="flex flex-col gap-2 md:flex-row md:items-start">
          <div className="flex w-full items-center gap-2 md:w-[80%]">
            <div className="w-full">
              <SearchInput basePath="/admin/orders" placeholder="Cari invoice / pembeli / judul buku..." inputClassName="border-[#F0CBCB] bg-white focus-visible:ring-[#D97A7A]" />
            </div>
            <PageSizeSelect basePath="/admin/orders" />
          </div>
          <OrderFilter
            basePath="/admin/orders"
            batches={batches}
            className="w-full md:order-first md:w-[20%]"
          />
        </div>
      </div>

      <Suspense fallback={<ListLoader />}>
        <OrdersList searchParams={sp} />
      </Suspense>
    </div>
  );
}