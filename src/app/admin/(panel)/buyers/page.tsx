import { db } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Pencil, Users, Phone, MapPin, Hand, IdCard, AtSign, ListOrdered } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { NavActionButton } from "@/components/NavActionButton";
import { SearchInput } from "@/components/SearchInput";
import { deleteBuyer } from "@/server/actions/buyers";
import { Pagination } from "@/components/Pagination";
import { BuyerCard } from "@/components/BuyerCard";

const PAGE_SIZE = 20;

export default async function AdminBuyersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const qRaw = (searchParams?.q ?? "").trim();
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);

  const where = q
    ? {
        role: "USER" as const,
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
          { username: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : { role: "USER" as const };

  const [totalBuyers, totalFiltered, buyers] = await Promise.all([
    db.user.count({ where: { role: "USER" } }),
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: { id: true, username: true, name: true, phone: true, contact: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Users className="h-6 w-6" />
          Daftar Pembeli
        </h2>
        <NavActionButton
          href="/admin/buyers/new"
          icon={<UserPlus className="h-4 w-4" />}
          className="border border-input bg-black px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#D97A7A] hover:text-white"
        >
          Tambah Pembeli
        </NavActionButton>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <IdCard className="h-4 w-4" />
            Total Pembeli
          </p>
          <p className="text-2xl font-bold">{totalBuyers}</p>
        </div>
      </div>

      <div className="w-full md:max-w-md">
        <SearchInput basePath="/admin/buyers" placeholder="Cari username / nama / nomor telepon..." />
      </div>

      {/* Mobile: card layout */}
      <div className="space-y-3 md:hidden">
        {buyers.map((b) => (
          <BuyerCard
            key={b.id}
            buyer={{
              id: b.id,
              username: b.username,
              name: b.name,
              phone: b.phone,
              contact: b.contact,
            }}
            onDelete={deleteBuyer.bind(null, b.id)}
          />
        ))}
        {buyers.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            Belum ada pembeli.
          </div>
        )}
      </div>
      </div>

      {/* Desktop: table layout */}
      <div className="hidden rounded-lg border md:block">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-b border-input" style={{ backgroundColor: "#F2F1ED" }}>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1">
                    <ListOrdered className="h-3.5 w-3.5" />
                    No
                  </span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1">
                    <AtSign className="h-3.5 w-3.5" />
                    Username
                  </span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Nama
                  </span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    Nomor Telepon
                  </span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Alamat
                  </span>
                </TableHead>
              <TableHead className="text-center font-bold">
                  <span className="inline-flex items-center gap-1">
                    <Hand className="h-3.5 w-3.5" />
                    Aksi
                  </span>
                </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buyers.map((b, i) => (
              <TableRow key={b.id} className="border-b border-input last:border-0">
                <TableCell className="text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + i + 1}
                </TableCell>
                <TableCell>{b.username ?? "-"}</TableCell>
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
                    <ConfirmDeleteButton
                      title="Konfirmasi Hapus"
                      description={`Apakah anda benar ingin menghapus pembeli "${b.name}"?`}
                      successMessage="Pembeli dihapus"
                      onConfirm={deleteBuyer.bind(null, b.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {buyers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Belum ada pembeli.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mx-auto max-w-5xl">
      <Pagination
        total={totalFiltered}
        page={page}
        pageSize={PAGE_SIZE}
        basePath="/admin/buyers"
        query={{ q: qRaw }}
      />
      </div>
    </div>
  );
}
