import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/session";
import { StatusSelect, PaymentStatusSelect } from "@/components/OrderRow";
import { NavActionButton } from "@/components/NavActionButton";
import { CreateBatchDialog } from "@/components/CreateBatchDialog";
import { DeleteOrderButton } from "@/components/DeleteOrderButton";
import { OrderSearch } from "@/components/OrderSearch";
import { Pagination } from "@/components/Pagination";
import { ETAS } from "@/lib/orderOptions";
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

function fmt(rupiah: number | null | undefined) {
  if (rupiah == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(rupiah);
}

function etaLabel(v: string | null | undefined) {
  if (v == null) return "—";
  return ETAS.find((e) => e.value === v)?.label ?? v;
}

function batchLabel(v: string | null | undefined) {
  if (v == null) return "—";
  return v;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireRole("SUPER_ADMIN");

  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const qRaw = (searchParams?.q ?? "").trim();
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);

  const where: Prisma.OrderWhereInput | undefined = q
    ? {
        OR: [
          { invoiceNumber: { contains: q, mode: "insensitive" as const } },
          { buyer: { name: { contains: q, mode: "insensitive" as const } } },
          { items: { some: { book: { title: { contains: q, mode: "insensitive" as const } } } } },
        ],
      }
    : undefined;

  const [totalOrders, totalFiltered, orders] = await Promise.all([
    db.order.count(),
    db.order.count({ where }),
    db.order.findMany({
      where,
      include: {
        buyer: { select: { name: true } },
        batch: true,
        items: { include: { book: { select: { title: true, formats: true } } } },
      },
      orderBy: { soldAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <ShoppingCart className="h-6 w-6" />
          List Order
        </h2>
        <div className="flex items-center gap-2">
          <CreateBatchDialog />
          <NavActionButton
            href="/admin/orders/new"
            icon={<Plus className="h-4 w-4" />}
            className="border border-input shadow-sm transition-colors hover:bg-[#FED6D6] hover:text-black"
          >
            Tambah Order
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
            {fmt(
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
            {fmt(
              orders.reduce((acc, s) => acc + (s.remaining ?? 0), 0)
            )}
          </p>
        </div>
      </div>

      <div className="w-full md:max-w-md">
        <OrderSearch />
      </div>

      <div className="overflow-x-auto rounded-lg border">
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
                  <span className="flex items-center gap-1"><PackageCheck className="h-3.5 w-3.5" />Status Order</span>
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
                <TableCell>{batchLabel(s.batch?.name)}</TableCell>
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
                      <li key={i}>{fmt(it.unitPrice)}</li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>{fmt(s.total)}</TableCell>
                <TableCell>{fmt(s.dp)}</TableCell>
                <TableCell>{fmt(s.remaining)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <PaymentStatusSelect orderId={s.id} current={s.paymentStatus} />
                    {s.dp != null && (
                      <p className="text-xs text-muted-foreground">
                        DP {fmt(s.dp)} / sisa {fmt(s.remaining)}
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
                    <DeleteOrderButton id={s.id} invoiceNumber={s.invoiceNumber} />
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
        query={{ q: qRaw }}
      />
    </div>
  );
}