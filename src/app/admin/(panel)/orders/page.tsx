import { db } from "@/lib/db";
import { Prisma, PaymentStatus, OrderStatus, Eta, Source } from "@prisma/client";
import { StatusSelect, PaymentStatusSelect } from "@/components/OrderRow";
import { NavActionButton } from "@/components/NavActionButton";
import { CreateBatchDialog } from "@/components/CreateBatchDialog";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { SearchInput } from "@/components/SearchInput";
import { deleteOrder } from "@/server/actions/orders";
import { Pagination } from "@/components/Pagination";
import { ETAS, STATUSES, PAYMENT_STATUSES, SOURCES } from "@/lib/orderOptions";
import { formatIDR } from "@/lib/format";
import { OrderCard } from "@/components/OrderCard";
import { OrderFilter } from "@/components/OrderFilter";
import { Plus, Pencil, ShoppingCart, FileText, Coins, HandCoins, ReceiptText, Layers, CalendarClock, UserRound, BookOpen, Tag, ListOrdered, Banknote, Calculator, Wallet, PiggyBank, ShieldCheck, PackageCheck, Hand } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

function etaLabel(v: string | null | undefined) {
  if (v == null) return "—";
  return ETAS.find((e) => e.value === v)?.label ?? v;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    page?: string;
    paymentStatus?: string;
    status?: string;
    batch?: string;
    eta?: string;
    source?: string;
  };
}) {
  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const qRaw = (searchParams?.q ?? "").trim();
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);

  const paymentStatuses = (searchParams?.paymentStatus ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => PAYMENT_STATUSES.some((p) => p.value === s));
  const status = searchParams?.status?.trim();
  const statusValid = STATUSES.some((p) => p.value === status) ? status : undefined;
  const batchId = searchParams?.batch?.trim();
  const eta = searchParams?.eta?.trim();
  const etaValid = ETAS.some((e) => e.value === eta) ? eta : undefined;
  const sources = (searchParams?.source ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SOURCES.some((x) => x.value === s));

  const where: Prisma.OrderWhereInput = {};
  if (q) {
    where.OR = [
      { invoiceNumber: { contains: q, mode: "insensitive" as const } },
      { buyer: { name: { contains: q, mode: "insensitive" as const } } },
      { items: { some: { book: { title: { contains: q, mode: "insensitive" as const } } } } },
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
  if (sources.length > 0) {
    where.source = { in: sources as Source[] };
  }

  const [totalOrders, totalFiltered, orders, batches] = await Promise.all([
    db.order.count(),
    db.order.count({ where }),
    db.order.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, phone: true, contact: true } },
        batch: true,
        items: { include: { book: { select: { title: true, formats: true, status: true } } } },
      },
      orderBy: { soldAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.batch.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <ShoppingCart className="h-6 w-6" />
          List Pesanan
        </h2>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <CreateBatchDialog />
          <NavActionButton
            href="/admin/orders/new"
            icon={<Plus className="h-4 w-4" />}
            className="h-9 w-full border border-input bg-black px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#D97A7A] hover:text-white sm:w-40"
          >
            Tambah Pesanan
          </NavActionButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Total Order
          </p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Coins className="h-4 w-4" />
            Total DP
          </p>
          <p className="text-xl font-bold">
            {formatIDR(
              orders.reduce((acc, s) => acc + (s.dp ?? 0), 0)
            )}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <HandCoins className="h-4 w-4" />
            Total Sisa
          </p>
          <p className="text-xl font-bold">
            {formatIDR(
              orders.reduce((acc, s) => acc + (s.remaining ?? 0), 0)
            )}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <OrderFilter basePath="/admin/orders" batches={batches} />
        <div className="w-[70%] md:w-[80%]">
          <SearchInput basePath="/admin/orders" placeholder="Cari invoice / pembeli / judul buku..." />
        </div>
      </div>

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
              source: s.source,
              total: s.total,
              dp: s.dp,
              remaining: s.remaining,
              paymentStatus: s.paymentStatus,
              status: s.status,
              batch: s.batch,
              buyer: s.buyer,
              items: s.items.map((it) => ({
                id: it.id,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                subtotal: it.subtotal,
                book: { title: it.book.title, formats: it.book.formats, status: it.book.status },
              })),
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
                  <span className="flex items-center gap-1"><ReceiptText className="h-3.5 w-3.5" />Invoice</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />Batch</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />Eta</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />Nama</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />Judul Buku</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />Format</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><ListOrdered className="h-3.5 w-3.5" />Quantity</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" />Harga</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><Calculator className="h-3.5 w-3.5" />Total</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />DP</span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1"><PiggyBank className="h-3.5 w-3.5" />Remaining</span>
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
              <TableRow key={s.id} className="border-b border-input last:border-0">
                <TableCell className="font-mono text-xs font-medium">{s.invoiceNumber}</TableCell>
                <TableCell>{s.batch?.name || "—"}</TableCell>
                <TableCell>{etaLabel(s.eta)}</TableCell>
                <TableCell>{s.buyer.name}</TableCell>
                <TableCell>
                  <ul className="text-xs">
                    {s.items.map((it, i) => (
                      <li key={i}>{it.book.title}</li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>
                  <ul className="text-xs">
                    {s.items.map((it, i) => (
                      <li key={i}>
                        {it.book.formats.length > 0 ? it.book.formats.join(", ") : "—"}
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>
                  <ul className="text-xs">
                    {s.items.map((it, i) => (
                      <li key={i}>{it.quantity}</li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>
                  <ul className="text-xs">
                    {s.items.map((it, i) => (
                      <li key={i}>{formatIDR(it.unitPrice)}</li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>{formatIDR(s.total)}</TableCell>
                <TableCell>{formatIDR(s.dp)}</TableCell>
                <TableCell>{formatIDR(s.remaining)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <PaymentStatusSelect orderId={s.id} current={s.paymentStatus} />
                    {s.dp != null && (
                      <p className="text-xs text-muted-foreground">
                        DP {formatIDR(s.dp)} / sisa {formatIDR(s.remaining)}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusSelect orderId={s.id} current={s.status} />
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
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
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={14} className="text-center text-muted-foreground">
                  No orders yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        total={totalFiltered}
        page={page}
        pageSize={PAGE_SIZE}
        basePath="/admin/orders"
        query={{
          q: qRaw,
          paymentStatus: searchParams?.paymentStatus ?? "",
          status: searchParams?.status ?? "",
          batch: searchParams?.batch ?? "",
          eta: searchParams?.eta ?? "",
          source: searchParams?.source ?? "",
        }}
      />
    </div>
  );
}