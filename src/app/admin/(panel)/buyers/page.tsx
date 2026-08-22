import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Pencil } from "lucide-react";
import { DeleteBuyerButton } from "@/components/DeleteBuyerButton";
import { NavActionButton } from "@/components/NavActionButton";
import { BuyerSearch } from "@/components/BuyerSearch";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 20;

export default async function AdminBuyersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireRole("SUPER_ADMIN");

  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const qRaw = (searchParams?.q ?? "").trim();
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);

  const where = q
    ? {
        role: "USER" as const,
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : { role: "USER" as const };

  const [totalBuyers, totalFiltered, buyers] = await Promise.all([
    db.user.count({ where: { role: "USER" } }),
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Daftar Pembeli</h2>
        <NavActionButton
          href="/admin/buyers/new"
          icon={<UserPlus className="h-4 w-4" />}
          className="border border-input shadow-sm transition-colors hover:bg-[#FED6D6] hover:text-black"
        >
          Tambah Pembeli
        </NavActionButton>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Pembeli</p>
          <p className="text-2xl font-bold">{totalBuyers}</p>
        </div>
      </div>

      <div className="w-full md:max-w-md">
        <BuyerSearch />
      </div>

      <div className="rounded-lg border">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-b border-input" style={{ backgroundColor: "#F2F1ED" }}>
              <TableHead className="font-bold">Nama</TableHead>
              <TableHead className="font-bold">Nomor Telepon</TableHead>
              <TableHead className="font-bold">Alamat</TableHead>
              <TableHead className="text-center font-bold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buyers.map((b) => (
              <TableRow key={b.id} className="border-b border-input last:border-0">
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>{b.phone ?? "-"}</TableCell>
                <TableCell>{b.contact || "-"}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <NavActionButton
                      href={`/admin/buyers/${b.id}/edit`}
                      icon={<Pencil className="h-3.5 w-3.5" />}
                      className="h-9 border border-input bg-transparent px-3 text-xs text-black shadow-sm transition-colors hover:bg-yellow-400 hover:text-black"
                    >
                      Ubah
                    </NavActionButton>
                    <DeleteBuyerButton id={b.id} name={b.name} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {buyers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Belum ada pembeli.
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
        basePath="/admin/buyers"
        query={{ q: qRaw }}
      />
    </div>
  );
}
