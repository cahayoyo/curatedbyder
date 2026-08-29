import { db } from "@/lib/db";
import { Suspense } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Pencil, Users, Phone, MapPin, Hand, IdCard, AtSign } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { NavActionButton } from "@/components/NavActionButton";
import { SearchInput } from "@/components/SearchInput";
import { deleteBuyer } from "@/server/actions/buyers";
import { Pagination } from "@/components/Pagination";
import { BuyerCard } from "@/components/BuyerCard";
import { SortButton } from "@/components/SortButton";
import { ListLoader } from "@/components/ListLoader";

const PAGE_SIZE = 20;

type BuyerSearchParams = { q?: string; page?: string; sort?: string; dir?: string };

async function BuyersList({ searchParams }: { searchParams: BuyerSearchParams }) {
  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const qRaw = (searchParams?.q ?? "").trim();
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);

  const sort = searchParams?.sort?.trim();
  const sortValid = ["username", "name"].includes(sort ?? "")
    ? (sort as "username" | "name")
    : undefined;
  const dir = searchParams?.dir?.trim() === "desc" ? ("desc" as const) : ("asc" as const);

  const orderBy =
    sortValid === "name"
      ? { name: dir }
      : sortValid === "username"
        ? { username: dir }
        : { createdAt: "desc" as const };

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

  const [totalFiltered, buyers] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: { id: true, username: true, name: true, phone: true, contact: true },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <>
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

      {/* Desktop: table layout */}
      <div className="hidden rounded-lg border md:block">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-b border-input" style={{ backgroundColor: "#F2F1ED" }}>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1">
                    <AtSign className="h-3.5 w-3.5" />
                    <SortButton label="Username" column="username" currentSort={sortValid} currentDir={dir} basePath="/admin/buyers" query={{ q: qRaw }} />
                  </span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <SortButton label="Nama" column="name" currentSort={sortValid} currentDir={dir} basePath="/admin/buyers" query={{ q: qRaw }} />
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
            {buyers.map((b) => (
              <TableRow key={b.id} className="border-b border-input last:border-0">
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
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Belum ada pembeli.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <Pagination
          total={totalFiltered}
          page={page}
          pageSize={PAGE_SIZE}
          basePath="/admin/buyers"
          query={{ q: qRaw, sort: sortValid ?? "", dir: searchParams?.dir?.trim() === "desc" ? "desc" : "" }}
        />
      </div>
    </>
  );
}

export default async function AdminBuyersPage({
  searchParams,
}: {
  searchParams: BuyerSearchParams;
}) {
  const totalBuyers = await db.user.count({ where: { role: "USER" } });

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

        <div className="w-full md:grid md:grid-cols-2 md:gap-4">
          <SearchInput basePath="/admin/buyers" placeholder="Cari username / nama / nomor telepon..." />
        </div>
      </div>

      <Suspense fallback={<ListLoader />}>
        <BuyersList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}