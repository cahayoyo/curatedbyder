import { db } from "@/lib/db";
import { Fragment, Suspense } from "react";
import { Prisma, PaymentStatus, OrderStatus, Eta } from "@prisma/client";
import { StatusSelect, PaymentStatusSelect } from "@/components/OrderRow";
import { NavActionButton } from "@/components/NavActionButton";
import { ManageBatchDialog } from "@/components/ManageBatchDialog";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { SearchInput } from "@/components/SearchInput";
import { deleteOrder } from "@/server/actions/orders";
import { Pagination } from "@/components/Pagination";
import { ETAS, STATUSES, PAYMENT_STATUSES, etaLabel, FORMAT_BADGE } from "@/lib/orderOptions";
import { formatIDR } from "@/lib/format";
import { OrderCard } from "@/components/OrderCard";
import { OrderSummaryAccordion, type OrderSummaryDTO } from "@/components/OrderSummaryAccord";
import { OrderViewButton } from "@/components/OrderViewButton";
import { OrderFilter } from "@/components/OrderFilter";
import { SortButton } from "@/components/SortButton";
import { ListLoader } from "@/components/ListLoader";
import { Plus, Pencil, ShoppingCart, ReceiptText, Layers, CalendarClock, UserRound, BookOpen, Tag, ListOrdered, Banknote, Calculator, Wallet, PiggyBank, ShieldCheck, PackageCheck, Hand, Truck, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

type OrderSearchParams = {
  q?: string;
  page?: string;
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
  buyer: { select: { id: true, name: true, phone: true, contact: true } },
  batch: { select: { id: true, name: true } },
  items: {
    include: {
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

function itemFormats(orderBatchId: string | undefined, it: ItemOrToy): string[] {
  if (it.toy) return [];
  const src = it.book;
  if (!src) return [];
  const bp = src.batchPrices.find((x) => x.batchId === orderBatchId);
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
      <span className="ml-1 inline-flex shrink-0 items-center rounded-full border border-sky-300 bg-sky-100 px-1.5 text-[10px] font-semibold text-sky-800">
        Buku
      </span>
    );
  if (kind === "MAINAN")
    return (
      <span className="ml-1 inline-flex shrink-0 items-center rounded-full border border-amber-300 bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">
        Mainan
      </span>
    );
  return null;
}

function toItemDTO(
  it: ItemOrToy & { id: string; quantity: number; unitPrice: number; subtotal: number },
  orderBatchId: string | undefined
): OrderItemDTO {
  return {
    id: it.id,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    subtotal: it.subtotal,
    kind: itemKind(it),
    book: {
      title: itemTitle(it),
      formats: itemFormats(orderBatchId, it),
      status: itemStatus(it),
    },
  };
}

function orderByClause(
  s: "batch" | "eta" | "name" | "invoice" | "total" | "dp" | "remaining" | undefined,
  d: "asc" | "desc"
): Prisma.OrderOrderByWithRelationInput {
  switch (s) {
    case "batch":
      return { batch: { name: d } };
    case "eta":
      return { eta: d };
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
  if (statusValid) {
    where.status = statusValid as OrderStatus;
  }
  if (batchId) {
    where.batchId = batchId;
  }
  if (etaValid) {
    where.eta = etaValid as Eta;
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
    orders = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else {
    orders = await db.order.findMany({
      where,
      include: orderInclude,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
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
              eta: s.eta,
              soldAt: s.soldAt,
              total: s.total,
              dp: s.dp,
              remaining: s.remaining,
              shippingCost: s.shippingCost,
              trackingNumber: s.trackingNumber,
              paymentStatus: s.paymentStatus,
              status: s.status,
              batch: s.batch,
              buyer: s.buyer,
              items: s.items.map((it) => toItemDTO(it, s.batchId)),
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
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-b border-input" style={{ backgroundColor: "#F2F1ED" }}>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><ReceiptText className="h-3.5 w-3.5" /><SortButton label="Invoice" column="invoice" type="num" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /><SortButton label="Batch" column="batch" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /><SortButton label="ETA" column="eta" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /><SortButton label="Nama" column="name" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /><SortButton label="Nama Produk" column="book" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />Format</span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="flex items-center gap-1"><ListOrdered className="h-3.5 w-3.5" />Quantity</span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" /><SortButton label="Harga" column="price" type="num" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><Calculator className="h-3.5 w-3.5" /><SortButton label="Total" column="total" type="num" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /><SortButton label="DP" column="dp" type="num" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><PiggyBank className="h-3.5 w-3.5" /><SortButton label="Remaining" column="remaining" type="num" currentSort={sortValid} currentDir={dir} basePath="/admin/orders" query={pageQuery} /></span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />Ongkir</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" />No Resi</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />Status Pembayaran</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><PackageCheck className="h-3.5 w-3.5" />Status Pesanan</span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1"><Hand className="h-3.5 w-3.5" />Aksi</span>
                </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((s) => (
              <Fragment key={s.id}>
                <TableRow className="border-b border-input last:border-0">
                  <TableCell className="font-mono text-xs font-medium" rowSpan={s.items.length}>{s.invoiceNumber}</TableCell>
                  <TableCell rowSpan={s.items.length}>{s.batch?.name || "—"}</TableCell>
                  <TableCell rowSpan={s.items.length}>{etaLabel(s.eta)}</TableCell>
                  <TableCell rowSpan={s.items.length}>{s.buyer.name}</TableCell>
                  <TableCell className="text-center text-xs">
                    <span className="inline-flex items-center">
                      {s.items[0] ? itemTitle(s.items[0]) : "—"}
                      <ProductLabel it={s.items[0]} />
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {itemFormats(s.batchId, s.items[0]).length > 0
                        ? itemFormats(s.batchId, s.items[0]).map((f) => (
                            <span
                              key={f}
                              className={`inline-flex h-4 items-center rounded-full border px-1.5 text-[10px] font-medium leading-none ${FORMAT_BADGE[f] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
                            >
                              {f}
                            </span>
                          ))
                        : ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs">{s.items[0].quantity}</TableCell>
                  <TableCell className="text-center text-xs">{formatIDR(s.items[0].unitPrice)}</TableCell>
                  <TableCell className="border-l border-input text-center" rowSpan={s.items.length}>{formatIDR(s.total)}</TableCell>
                  <TableCell className="border-l border-input" rowSpan={s.items.length}>{formatIDR(s.dp)}</TableCell>
                  <TableCell className="border-l border-input" rowSpan={s.items.length}>{formatIDR(s.remaining)}</TableCell>
                  <TableCell className="border-l border-input" rowSpan={s.items.length}>{s.shippingCost != null ? formatIDR(s.shippingCost) : "--"}</TableCell>
                  <TableCell className="border-l border-input font-mono text-xs" rowSpan={s.items.length}>{s.trackingNumber || "—"}</TableCell>
                  <TableCell className="border-l border-input" rowSpan={s.items.length}>
                    <div className="space-y-1">
                      <PaymentStatusSelect orderId={s.id} current={s.paymentStatus} />
                      {s.dp != null && s.paymentStatus !== "LUNAS" && (
                        <p className="text-xs text-muted-foreground">
                          DP {formatIDR(s.dp)} / sisa {formatIDR(s.remaining)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="border-l border-input" rowSpan={s.items.length}>
                    <StatusSelect orderId={s.id} current={s.status} />
                  </TableCell>
                  <TableCell className="border-l border-input text-center" rowSpan={s.items.length}>
                    <div className="flex justify-center gap-2">
                      <OrderViewButton
                        order={{
                          id: s.id,
                          invoiceNumber: s.invoiceNumber,
                          eta: s.eta,
                          soldAt: s.soldAt,
                          total: s.total,
                          dp: s.dp,
                          remaining: s.remaining,
                          shippingCost: s.shippingCost,
                          trackingNumber: s.trackingNumber,
                          paymentStatus: s.paymentStatus,
                          status: s.status,
                          batch: s.batch,
                          buyer: s.buyer,
                          items: s.items.map((it) => toItemDTO(it, s.batchId)),
                        }}
                      />
                      <NavActionButton
                        href={`/admin/orders/${s.id}/edit`}
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        className="h-9 border border-input bg-transparent px-3 text-xs text-black shadow-sm transition-colors hover:bg-yellow-400 hover:text-black"
                      >
                        Ubah
                      </NavActionButton>
                      <ConfirmDeleteButton
                        title="Konfirmasi Hapus"
                        description={`Apakah anda benar ingin menghapus order "${s.invoiceNumber}"? Stok buku akan dikembalikan.`}
                        successMessage="Order dihapus"
                        onConfirm={deleteOrder.bind(null, s.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
                {s.items.slice(1).map((it, i) => (
                  <TableRow key={`${s.id}-item-${i}`} className="border-b border-input last:border-0">
                    <TableCell className="text-center text-xs">
                    <span className="inline-flex items-center">
                      {itemTitle(it)}
                      <ProductLabel it={it} />
                    </span>
                  </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {itemFormats(s.batchId, it).length > 0
                          ? itemFormats(s.batchId, it).map((f) => (
                              <span
                                key={f}
                                className={`inline-flex h-4 items-center rounded-full border px-1.5 text-[10px] font-medium leading-none ${FORMAT_BADGE[f] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
                              >
                                {f}
                              </span>
                            ))
                          : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs">{it.quantity}</TableCell>
                    <TableCell className="text-center text-xs">{formatIDR(it.unitPrice)}</TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={16} className="text-center text-muted-foreground">
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
          pageSize={PAGE_SIZE}
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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: OrderSearchParams;
}) {
  const [totalOrders, batches, sums, byBatch, byEta, byPayment, byStatus] =
    await Promise.all([
      db.order.count(),
      db.batch.findMany({ orderBy: { name: "asc" } }),
      db.order.aggregate({ _sum: { total: true } }),
      db.order.groupBy({ by: ["batchId"], _count: { _all: true }, _sum: { total: true } }),
      db.order.groupBy({ by: ["eta"], _count: { _all: true }, _sum: { total: true } }),
      db.order.groupBy({ by: ["paymentStatus"], _count: { _all: true }, _sum: { total: true } }),
      db.order.groupBy({ by: ["status"], _count: { _all: true }, _sum: { total: true } }),
    ]);

  const batchMap = new Map(byBatch.map((b) => [b.batchId, b]));
  const etaMap = new Map(byEta.map((e) => [e.eta, e]));
  const paymentMap = new Map(byPayment.map((p) => [p.paymentStatus, p]));
  const statusMap = new Map(byStatus.map((s) => [s.status, s]));

  const summaryData: OrderSummaryDTO = {
    totalOrders,
    grandTotal: sums._sum.total ?? 0,
    byBatch: batches.map((b) => ({
      value: b.id,
      label: b.name,
      count: batchMap.get(b.id)?._count._all ?? 0,
      total: batchMap.get(b.id)?._sum.total ?? 0,
    })),
    byEta: ETAS.map((e) => ({
      value: e.value,
      label: e.label,
      count: etaMap.get(e.value)?._count._all ?? 0,
      total: etaMap.get(e.value)?._sum.total ?? 0,
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
      total: statusMap.get(s.value)?._sum.total ?? 0,
    })),
  };

  return (
    <div className="space-y-4">
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
              className="h-9 w-full border border-input bg-black px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#D97A7A] hover:text-white sm:w-40"
            >
              Tambah Pesanan
            </NavActionButton>
          </div>
        </div>

        <OrderSummaryAccordion {...summaryData} />

        <div className="flex items-start gap-2">
          <OrderFilter basePath="/admin/orders" batches={batches} />
          <div className="w-[70%] md:w-[80%]">
            <SearchInput basePath="/admin/orders" placeholder="Cari invoice / pembeli / judul buku..." />
          </div>
        </div>
      </div>

      <Suspense fallback={<ListLoader />}>
        <OrdersList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}