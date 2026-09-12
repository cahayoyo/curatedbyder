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
import {
  AtSign,
  Filter,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Settings2,
  User,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { NavActionButton } from "@/components/NavActionButton";
import { SearchInput } from "@/components/SearchInput";
import { PageSizeSelect } from "@/components/PageSizeSelect";
import { deleteBuyer } from "@/server/actions/buyers";
import { Pagination } from "@/components/Pagination";
import { BuyerCard } from "@/components/BuyerCard";
import { SortButton } from "@/components/SortButton";
import { BookSortSelect } from "@/components/BookSortSelect";
import { MobileBuyerFilters, BUYER_SORT_OPTIONS } from "@/components/MobileBuyerFilters";
import { ParamSelect } from "@/components/ParamSelect";
import { ListLoader } from "@/components/ListLoader";
import { cn } from "@/lib/utils";
import { parsePerPage, perQuery, scalarize } from "@/lib/pagination";
import type { Prisma } from "@prisma/client";

const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const BUYER_STATUS_OPTIONS = [
  { value: "aktif", label: "Pembeli Aktif" },
  { value: "tidak", label: "Pembeli Tidak Aktif" },
];

type BuyerSearchParams = {
  q?: string;
  status?: string;
  page?: string;
  per?: string;
  sort?: string;
  dir?: string;
};

function parseBuyerFilters(searchParams: BuyerSearchParams) {
  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const qRaw = (searchParams?.q ?? "").trim();

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

  const statusRaw = searchParams?.status?.trim();
  const status = statusRaw === "aktif" || statusRaw === "tidak" ? statusRaw : undefined;

  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);

  const where: Prisma.UserWhereInput = { role: "USER" };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) {
    const since = new Date(new Date().getTime() - ACTIVE_WINDOW_MS);
    where.orders =
      status === "aktif"
        ? { some: { createdAt: { gte: since } } }
        : { none: { createdAt: { gte: since } } };
  }

  return { qRaw, status, sortValid, dir, orderBy, where, page };
}

async function BuyersStats() {
  const since = new Date(new Date().getTime() - ACTIVE_WINDOW_MS);
  const [total, active] = await Promise.all([
    db.user.count({ where: { role: "USER" } }),
    db.user.count({
      where: { role: "USER", orders: { some: { createdAt: { gte: since } } } },
    }),
  ]);

  const cards = [
    {
      label: "Total Pembeli",
      short: "Total",
      caption: "Semua akun pembeli",
      value: total,
      icon: Users,
      card: "border-[#F3CFCF] from-[#FDF0F0] to-[#F9DEDE]",
      circle: "bg-[#F6CFCF] text-[#C96A6A]",
      watermark: "text-[#E9B5B5]",
    },
    {
      label: "Pembeli Aktif",
      short: "Aktif",
      caption: "Transaksi dalam 1 bulan terakhir",
      value: active,
      icon: UserCheck,
      card: "border-[#CDE6D2] from-[#EEF7EF] to-[#DFF0E2]",
      circle: "bg-[#CFE8D5] text-[#3F8A54]",
      watermark: "text-[#BFDCC6]",
    },
    {
      label: "Pembeli Tidak Aktif",
      short: "Tidak Aktif",
      caption: "Tanpa transaksi 1 bulan terakhir",
      value: total - active,
      icon: UserX,
      card: "border-[#F0DDB4] from-[#FDF6E7] to-[#F9EBCB]",
      circle: "bg-[#F6E3B8] text-[#B98A1F]",
      watermark: "text-[#EED9A8]",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn(
            "relative overflow-hidden rounded-xl border bg-gradient-to-br p-3 shadow-sm sm:p-4",
            c.card
          )}
        >
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1.5 xl:gap-x-3">
            <p className="col-span-2 text-[13px] leading-tight text-black/60 sm:text-[15px] xl:col-span-1 xl:col-start-2 xl:row-start-1">
              <span className="sm:hidden">{c.short}</span>
              <span className="hidden sm:inline">{c.label}</span>
            </p>
            <span
              className={cn(
                "col-start-1 row-start-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 xl:row-span-3 xl:row-start-1",
                c.circle
              )}
            >
              <c.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <p className="col-start-2 row-start-2 text-[26px] font-bold leading-tight sm:text-3xl xl:row-start-2">
              {c.value}
            </p>
            <p className="col-span-2 hidden text-[11px] leading-tight text-black/50 sm:block xl:col-span-1 xl:col-start-2 xl:row-start-3">
              {c.caption}
            </p>
          </div>
          <c.icon
            aria-hidden
            className={cn(
              "pointer-events-none absolute right-1 top-2 h-11 w-11 opacity-40 sm:right-6 sm:top-1/2 sm:h-14 sm:w-14 sm:-translate-y-1/2 sm:opacity-50",
              c.watermark
            )}
          />
        </div>
      ))}
    </div>
  );
}

async function BuyersList({ searchParams }: { searchParams: BuyerSearchParams }) {
  const { qRaw, status, sortValid, dir, orderBy, where, page } = parseBuyerFilters(searchParams);
  const per = parsePerPage(searchParams?.per);

  const [totalFiltered, buyers] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: { id: true, username: true, name: true, phone: true, contact: true },
      orderBy,
      skip: (page - 1) * per,
      take: per,
    }),
  ]);

  const from = totalFiltered === 0 ? 0 : (page - 1) * per + 1;
  const to = Math.min(page * per, totalFiltered);

  const sortQuery = { q: qRaw, status: status ?? "", per: searchParams?.per ?? "" };
  const paginationQuery = {
    q: qRaw,
    status: status ?? "",
    sort: sortValid ?? "",
    dir: searchParams?.dir?.trim() === "desc" ? "desc" : "",
    per: perQuery(per),
  };

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
          <div className="rounded-lg border p-6 text-center text-[15px] text-muted-foreground">
            Belum ada pembeli.
          </div>
        )}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden overflow-x-auto rounded-xl border border-[#F0CBCB]/60 bg-[#FDF1F1] [&_td]:border-r-0 [&_th]:border-r-0 md:block">
        <Table className="border-collapse text-[15px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent" style={{ backgroundColor: "#F3CFCF" }}>
              <TableHead className="w-12 text-center font-bold">
                No
              </TableHead>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <SortButton
                    label="Nama"
                    column="name"
                    currentSort={sortValid}
                    currentDir={dir}
                    basePath="/admin/buyers"
                    query={sortQuery}
                  />
                </span>
              </TableHead>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <AtSign className="h-3.5 w-3.5" />
                  <SortButton
                    label="Username"
                    column="username"
                    currentSort={sortValid}
                    currentDir={dir}
                    basePath="/admin/buyers"
                    query={sortQuery}
                  />
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
                  <Settings2 className="h-3.5 w-3.5" />
                  Aksi
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buyers.map((b, i) => (
              <TableRow key={b.id} className="hover:bg-[#F9DEDE]">
                <TableCell className="text-center text-[15px] text-black/60">
                  {(page - 1) * per + i + 1}
                </TableCell>
                <TableCell>{b.name}</TableCell>
                <TableCell>{b.username ?? "-"}</TableCell>
                <TableCell>{b.phone ?? "-"}</TableCell>
                <TableCell>{b.contact || "—"}</TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <NavActionButton
                      href={`/admin/buyers/${b.id}/edit`}
                      icon={<Pencil className="h-3.5 w-3.5" />}
                      className="h-9 border border-[#D97A7A]/40 bg-white px-3 text-xs text-[#D97A7A] shadow-sm hover:bg-[#D97A7A]/10 hover:text-[#D97A7A]"
                    >
                      Ubah
                    </NavActionButton>
                    <ConfirmDeleteButton
                      title="Hapus Pembeli?"
                      description={`Apakah anda benar ingin menghapus pembeli "${b.name}"?`}
                      warningText={`Data pembeli yang dihapus tidak akan bisa dikembalikan.`}
                      successMessage={`${b.name} berhasil dihapus!`}
                      triggerClassName="border border-[#D97A7A]/40 bg-white text-[#D97A7A] shadow-sm hover:bg-[#D97A7A]/10 hover:text-[#D97A7A]"
                      onConfirm={deleteBuyer.bind(null, b.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {buyers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Belum ada pembeli.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-black/60">
          {totalFiltered === 0
            ? "Tidak ada pembeli."
            : `Menampilkan ${from} - ${to} dari ${totalFiltered} pembeli.`}
        </p>
        <Pagination
          variant="rose"
          total={totalFiltered}
          page={page}
          pageSize={per}
          basePath="/admin/buyers"
          query={paginationQuery}
        />
      </div>
    </>
  );
}

export default async function AdminBuyersPage({
  searchParams,
}: {
  searchParams: Promise<BuyerSearchParams>;
}) {
  const sp = scalarize(await searchParams) as BuyerSearchParams;

  return (
    <div className="space-y-4 px-2 md:px-6 [--border:0_55%_87%] [--input:0_55%_87%]">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-[#F3CFCF] bg-gradient-to-br from-[#FDF0F0] to-[#F9DEDE] p-4 shadow-sm md:border-0 md:bg-none md:p-0 md:shadow-none">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6 text-[#D97A7A]" />
            Daftar Pembeli
          </h2>
          <p className="mt-1 text-[15px] text-muted-foreground">
            <span className="md:hidden">Kelola data pembeli di CuratedByDer.</span>
            <span className="hidden md:inline">
              Kelola data pembeli di CuratedByDer. Tambah, ubah, atau hapus data pembeli dengan
              mudah.
            </span>
          </p>
        </div>
        <NavActionButton
          href="/admin/buyers/new"
          icon={<Plus className="h-4 w-4" />}
          className="h-9 shrink-0 gap-1.5 rounded-md bg-[#D97A7A] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#c9686b] hover:text-white sm:h-11 sm:gap-2 sm:px-5 sm:text-[15px]"
        >
          Tambah Pembeli
        </NavActionButton>
      </div>

      <Suspense fallback={<ListLoader compact label="Memuat ringkasan..." />}>
        <BuyersStats />
      </Suspense>

      {/* Mobile: search + filter panel */}
      <MobileBuyerFilters basePath="/admin/buyers" />

      {/* Desktop: search + filter + sort + per page */}
      <div className="hidden items-center gap-2 md:flex">
        <div className="min-w-0 flex-1">
          <SearchInput
            basePath="/admin/buyers"
            placeholder="Cari username / nama / nomor telepon..."
            inputClassName="bg-white text-[15px]"
          />
        </div>
        <ParamSelect
          basePath="/admin/buyers"
          param="status"
          placeholder="Filter"
          icon={<Filter className="h-3.5 w-3.5" />}
          options={BUYER_STATUS_OPTIONS}
          triggerClassName="h-9 w-40"
        />
        <BookSortSelect
          basePath="/admin/buyers"
          options={BUYER_SORT_OPTIONS}
          triggerClassName="h-9 w-40"
        />
        <PageSizeSelect basePath="/admin/buyers" />
      </div>

      <Suspense fallback={<ListLoader />}>
        <BuyersList searchParams={sp} />
      </Suspense>
    </div>
  );
}
