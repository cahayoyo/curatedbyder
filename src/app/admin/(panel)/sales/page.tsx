import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/session";
import { StatusSelect, PaymentStatusSelect } from "@/components/SaleRow";
import { NavActionButton } from "@/components/NavActionButton";
import { DeleteSaleButton } from "@/components/DeleteSaleButton";
import { SaleSearch } from "@/components/SaleSearch";
import { Pagination } from "@/components/Pagination";
import { ETAS } from "@/lib/saleOptions";
import { Plus, Pencil } from "lucide-react";
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

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireRole("SUPER_ADMIN");

  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const qRaw = (searchParams?.q ?? "").trim();
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);

  const where: Prisma.SaleWhereInput | undefined = q
    ? {
        OR: [
          { invoiceNumber: { contains: q, mode: "insensitive" as const } },
          { buyer: { name: { contains: q, mode: "insensitive" as const } } },
          { items: { some: { book: { title: { contains: q, mode: "insensitive" as const } } } } },
        ],
      }
    : undefined;

  const [totalSales, totalFiltered, sales] = await Promise.all([
    db.sale.count(),
    db.sale.count({ where }),
    db.sale.findMany({
      where,
      include: {
        buyer: { select: { name: true } },
        items: { include: { book: { select: { title: true } } } },
      },
      orderBy: { soldAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">List Order</h2>
        <NavActionButton
          href="/admin/sales/new"
          icon={<Plus className="h-4 w-4" />}
          className="border border-input shadow-sm transition-colors hover:bg-[#FED6D6] hover:text-black"
        >
          Tambah Order
        </NavActionButton>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Order</p>
          <p className="text-2xl font-bold">{totalSales}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total DP</p>
          <p className="text-xl font-bold">
            {fmt(
              sales.reduce((acc, s) => acc + (s.dp ?? 0), 0)
            )}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Sisa</p>
          <p className="text-xl font-bold">
            {fmt(
              sales.reduce((acc, s) => acc + (s.remaining ?? 0), 0)
            )}
          </p>
        </div>
      </div>

      <div className="w-full md:max-w-md">
        <SaleSearch />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-b border-input" style={{ backgroundColor: "#F2F1ED" }}>
              <TableHead className="font-bold">Invoice</TableHead>
              <TableHead className="font-bold">Batch</TableHead>
              <TableHead className="font-bold">Eta</TableHead>
              <TableHead className="font-bold">Nama</TableHead>
              <TableHead className="font-bold">Judul Buku</TableHead>
              <TableHead className="font-bold">Format</TableHead>
              <TableHead className="font-bold">Quantity</TableHead>
              <TableHead className="font-bold">Harga</TableHead>
              <TableHead className="font-bold">Total</TableHead>
              <TableHead className="font-bold">DP</TableHead>
              <TableHead className="font-bold">Remaining</TableHead>
              <TableHead className="font-bold">Status Pembayaran</TableHead>
              <TableHead className="font-bold">Status Order</TableHead>
              <TableHead className="text-center font-bold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((s) => (
              <TableRow key={s.id} className="border-b border-input last:border-0">
                <TableCell className="font-mono text-xs font-medium">{s.invoiceNumber}</TableCell>
                <TableCell>{s.batch ?? "—"}</TableCell>
                <TableCell>{etaLabel(s.eta)}</TableCell>
                <TableCell>{s.buyer.name}</TableCell>
                <TableCell>
                  <ul className="text-xs">
                    {s.items.map((it, i) => (
                      <li key={i}>{it.book.title}</li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>{s.format ?? "—"}</TableCell>
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
                    <PaymentStatusSelect saleId={s.id} current={s.paymentStatus} />
                    {s.dp != null && (
                      <p className="text-xs text-muted-foreground">
                        DP {fmt(s.dp)} / sisa {fmt(s.remaining)}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusSelect saleId={s.id} current={s.status} />
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <NavActionButton
                      href={`/admin/sales/${s.id}/edit`}
                      icon={<Pencil className="h-3.5 w-3.5" />}
                      className="h-9 border border-input bg-transparent px-3 text-xs shadow-sm transition-colors hover:bg-yellow-400 hover:text-black"
                    >
                      Ubah
                    </NavActionButton>
                    <DeleteSaleButton id={s.id} invoiceNumber={s.invoiceNumber} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {sales.length === 0 && (
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
        basePath="/admin/sales"
        query={{ q: qRaw }}
      />
    </div>
  );
}