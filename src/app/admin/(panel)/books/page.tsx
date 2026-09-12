import { requireRole } from "@/lib/session";
import Image from "next/image";
import { Fragment, Suspense } from "react";
import { db } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  BookOpen,
  Building2,
  CircleCheckBig,
  Clock,
  ImageIcon,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  Settings2,
  Tag,
} from "lucide-react";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { NavActionButton } from "@/components/NavActionButton";
import { SearchInput } from "@/components/SearchInput";
import { PageSizeSelect } from "@/components/PageSizeSelect";
import { BookFilter } from "@/components/BookFilter";
import { SortButton } from "@/components/SortButton";
import { BookSortSelect } from "@/components/BookSortSelect";
import { PublisherSelect } from "@/components/PublisherSelect";
import { MobileBookFilters } from "@/components/MobileBookFilters";
import { formatIDR } from "@/lib/format";
import { deleteBook } from "@/server/actions/books";
import { Pagination } from "@/components/Pagination";
import { BookCard } from "@/components/BookCard";
import { FormatBadge } from "@/components/FormatBadge";
import { ListLoader } from "@/components/ListLoader";
import { cn, stockBadgeClass } from "@/lib/utils";
import { parsePerPage, perQuery, scalarize } from "@/lib/pagination";
import { FORMAT_TYPE } from "@/lib/orderOptions";

type BookSearchParams = {
  q?: string;
  publisher?: string;
  format?: string;
  page?: string;
  per?: string;
  status?: string;
  min?: string;
  max?: string;
  sort?: string;
  dir?: string;
};

function parseFilters(searchParams: BookSearchParams) {
  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const qRaw = (searchParams?.q ?? "").trim();

  const sort = searchParams?.sort?.trim();
  const sortValid = ["title", "publisher", "price", "stock"].includes(sort ?? "")
    ? (sort as "title" | "publisher" | "price" | "stock")
    : undefined;
  const dir = searchParams?.dir?.trim() === "desc" ? ("desc" as const) : ("asc" as const);

  const orderBy = (() => {
    if (sortValid === "title") return { title: dir };
    if (sortValid === "publisher") return { publisher: dir };
    if (sortValid === "price") return { price: dir };
    if (sortValid === "stock") return { stock: dir };
    return { createdAt: "desc" as const };
  })();

  const statuses = (searchParams?.status ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s === "READY_STOCK" || s === "PRE_ORDER");

  const publisher = (searchParams?.publisher ?? "").trim();

  const formatRaw = searchParams?.format?.trim();
  const format = (FORMAT_TYPE as readonly string[]).includes(formatRaw ?? "")
    ? (formatRaw as (typeof FORMAT_TYPE)[number])
    : ("" as const);

  const minRaw = Number(searchParams?.min);
  const maxRaw = Number(searchParams?.max);
  const min = Number.isFinite(minRaw) && minRaw >= 0 ? Math.floor(minRaw) : null;
  const max = Number.isFinite(maxRaw) && maxRaw >= 0 ? Math.floor(maxRaw) : null;

  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);

  const where: {
    OR?: { title?: { contains: string; mode: "insensitive" }; publisher?: { contains: string; mode: "insensitive" } }[];
    status?: { in: ("READY_STOCK" | "PRE_ORDER")[] };
    publisher?: string;
    formats?: { has: (typeof FORMAT_TYPE)[number] };
    price?: { gte?: number; lte?: number };
  } = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" as const } },
      { publisher: { contains: q, mode: "insensitive" as const } },
    ];
  }
  if (statuses.length > 0) {
    where.status = { in: statuses as ("READY_STOCK" | "PRE_ORDER")[] };
  }
  if (publisher) {
    where.publisher = publisher;
  }
  if (format) {
    where.formats = { has: format };
  }
  if (min != null || max != null) {
    where.price = {};
    if (min != null) where.price.gte = min;
    if (max != null) where.price.lte = max;
  }

  return { q, qRaw, publisher, format, sortValid, dir, orderBy, min, max, statuses, where, page };
}

async function BooksStats({ searchParams }: { searchParams: BookSearchParams }) {
  const { where } = parseFilters(searchParams);
  const [totalFiltered, statusCounts] = await Promise.all([
    db.book.count({ where }),
    db.book.groupBy({ by: ["status"], where, _count: { _all: true } }),
  ]);

  const readyCount =
    statusCounts.find((s) => s.status === "READY_STOCK")?._count._all ?? 0;
  const preOrderCount =
    statusCounts.find((s) => s.status === "PRE_ORDER")?._count._all ?? 0;

  const cards = [
    {
      label: "Total Buku",
      short: "Total Buku",
      value: totalFiltered,
      icon: BookOpen,
      card: "border-[#F3CFCF] from-[#FDF0F0] to-[#F9DEDE]",
      circle: "bg-[#F6CFCF] text-[#C96A6A]",
      watermark: "text-[#E9B5B5]",
    },
    {
      label: "Total Buku Ready Stok",
      short: "Stok Ready",
      value: readyCount,
      icon: PackageCheck,
      card: "border-[#CDE6D2] from-[#EEF7EF] to-[#DFF0E2]",
      circle: "bg-[#CFE8D5] text-[#3F8A54]",
      watermark: "text-[#BFDCC6]",
    },
    {
      label: "Total Buku Pre Order",
      short: "Pre Order",
      value: preOrderCount,
      icon: Clock,
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
                "col-start-1 row-start-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 xl:row-span-2 xl:row-start-1",
                c.circle
              )}
            >
              <c.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <p className="col-start-2 row-start-2 text-[26px] font-bold leading-tight sm:text-3xl xl:row-start-2">
              {c.value}
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

async function BooksList({ searchParams }: { searchParams: BookSearchParams }) {
  const { qRaw, publisher, format, sortValid, dir, orderBy, min, max, where, page } =
    parseFilters(searchParams);
  const per = parsePerPage(searchParams?.per);

  const [totalFiltered, books] = await Promise.all([
    db.book.count({ where }),
    db.book.findMany({
      where,
      orderBy,
      skip: (page - 1) * per,
      take: per,
      include: {
        batchPrices: { include: { batch: { select: { name: true } } } },
      },
    }),
  ]);

  const from = totalFiltered === 0 ? 0 : (page - 1) * per + 1;
  const to = Math.min(page * per, totalFiltered);

  const sortQuery = {
    q: qRaw,
    publisher: publisher,
    format: format,
    status: searchParams?.status ?? "",
    min: min != null ? String(min) : "",
    max: max != null ? String(max) : "",
    per: searchParams?.per ?? "",
  };

  return (
    <>
      {/* Mobile: list layout */}
      <div className="space-y-3 md:hidden">
        {books.map((b) => (
          <BookCard
            key={b.id}
            book={{
              id: b.id,
              title: b.title,
              image: b.image,
              publisher: b.publisher,
              stock: b.stock,
              status: b.status,
              variants: [
                {
                  key: `${b.id}-main`,
                  label: "Utama",
                  price: b.price,
                  formats: b.formats as string[],
                },
                ...b.batchPrices.map((bp) => ({
                  key: bp.id,
                  label: bp.batch.name,
                  price: bp.price,
                  formats: bp.formats as string[],
                })),
              ],
            }}
            onDelete={deleteBook.bind(null, b.id)}
          />
        ))}
        {books.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-[15px] text-muted-foreground">
            Belum ada buku.
          </div>
        )}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden overflow-x-auto rounded-xl border border-[#F0CBCB]/60 bg-[#FDF1F1] [&_td]:border-r-0 [&_th]:border-r-0 md:block">
        <Table className="border-collapse text-[15px]">
          <TableHeader>
            <TableRow
              className="hover:bg-transparent"
              style={{ backgroundColor: "#F3CFCF" }}
            >
              <TableHead className="w-12 text-center font-bold">
                No
              </TableHead>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  <SortButton
                    label="Buku"
                    column="title"
                    currentSort={sortValid}
                    currentDir={dir}
                    basePath="/admin/books"
                    query={sortQuery}
                  />
                </span>
              </TableHead>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  <SortButton
                    label="Publisher"
                    column="publisher"
                    currentSort={sortValid}
                    currentDir={dir}
                    basePath="/admin/books"
                    query={sortQuery}
                  />
                </span>
              </TableHead>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  Format
                </span>
              </TableHead>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5" />
                  <SortButton
                    label="Harga"
                    column="price"
                    type="num"
                    currentSort={sortValid}
                    currentDir={dir}
                    basePath="/admin/books"
                    query={sortQuery}
                  />
                </span>
              </TableHead>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  <SortButton
                    label="Stok"
                    column="stock"
                    type="num"
                    currentSort={sortValid}
                    currentDir={dir}
                    basePath="/admin/books"
                    query={sortQuery}
                  />
                </span>
              </TableHead>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <CircleCheckBig className="h-3.5 w-3.5" />
                  Status
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
            {books.map((b, i) => {
              const variants: {
                key: string;
                label: string;
                price: number;
                formats: string[];
              }[] = [
                {
                  key: `${b.id}-main`,
                  label: "Utama",
                  price: b.price,
                  formats: b.formats as string[],
                },
                ...b.batchPrices.map((bp) => ({
                  key: bp.id,
                  label: bp.batch.name,
                  price: bp.price,
                  formats: bp.formats as string[],
                })),
              ];
              return (
                <Fragment key={b.id}>
                  {variants.map((v, vi) => (
                    <TableRow
                      key={v.key}
                      className="hover:bg-[#F9DEDE]"
                    >
                      {vi === 0 && (
                        <>
                          <TableCell
                            className="text-center text-[15px] text-black/60"
                            rowSpan={variants.length}
                          >
                            {(page - 1) * per + i + 1}
                          </TableCell>
                          <TableCell rowSpan={variants.length}>
                            <div className="flex items-center gap-3">
                              <div className="relative h-28 w-[84px] shrink-0 overflow-hidden rounded border bg-black/5">
                                {b.image ? (
                                  <Image
                                    src={b.image}
                                    alt={b.title}
                                    fill
                                    sizes="112px"
                                    className="object-cover object-center"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <ImageIcon className="h-5 w-5 text-black/30" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="line-clamp-1 font-semibold">{b.title}</p>
                                <p className="mt-0.5 line-clamp-2 text-[13px] italic text-muted-foreground">
                                  {b.info || "—"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground" rowSpan={variants.length}>
                            {b.publisher || "—"}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        {v.formats.length > 0 ? (
                          <span className="flex flex-wrap gap-1">
                            {v.formats.map((f) => (
                              <FormatBadge key={f} value={f} />
                            ))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {variants.length > 1 && (
                          <span className="mb-0.5 inline-flex items-center rounded-full border border-[#F0CBCB] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#C96A6A]">
                            {v.label}
                          </span>
                        )}
                        <span className="block font-medium">{formatIDR(v.price)}</span>
                      </TableCell>
                      {vi === 0 && (
                        <>
                          <TableCell rowSpan={variants.length}>
                            <Badge
                              variant="outline"
                              className={cn(
                                stockBadgeClass(b.stock),
                                "h-6 min-w-9 justify-center px-2 text-[13px]"
                              )}
                            >
                              {b.stock}
                            </Badge>
                          </TableCell>
                          <TableCell rowSpan={variants.length}>
                            <Badge
                              variant="outline"
                              className={
                                b.status === "PRE_ORDER"
                                  ? "gap-1.5 border-amber-300 bg-yellow-300 text-yellow-900"
                                  : "gap-1.5 border-emerald-300 bg-emerald-100 text-emerald-800"
                              }
                            >
                              <span
                                className={
                                  b.status === "PRE_ORDER"
                                    ? "h-1.5 w-1.5 rounded-full bg-amber-500"
                                    : "h-1.5 w-1.5 rounded-full bg-emerald-500"
                                }
                              />
                              {b.status === "PRE_ORDER" ? "Pre Order" : "Ready Stok"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center" rowSpan={variants.length}>
                            <div className="flex justify-center gap-2">
                              <NavActionButton
                                href={`/admin/books/${b.id}/edit`}
                                icon={<Pencil className="h-3.5 w-3.5" />}
                                className="h-8 w-8 rounded-md border border-[#D97A7A]/40 bg-white p-0 text-[#D97A7A] shadow-sm hover:bg-[#D97A7A]/10 hover:text-[#D97A7A]"
                              >
                                <span className="sr-only">Ubah</span>
                              </NavActionButton>
                              <ConfirmDeleteButton
                                size="icon"
                                triggerClassName="border-[#D97A7A]/40 bg-white text-[#D97A7A] hover:bg-[#D97A7A]/10 hover:text-[#D97A7A]"
                                title="Hapus Buku?"
                                description={`Apakah anda benar ingin menghapus buku "${b.title}"?`}
                                warningText={`Data buku yang dihapus tidak akan bisa dikembalikan.`}
                                successMessage={`${b.title} berhasil dihapus!`}
                                onConfirm={deleteBook.bind(null, b.id)}
                              />
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </Fragment>
              );
            })}
            {books.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-muted-foreground"
                >
                  Belum ada buku.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-black/60">
          {totalFiltered === 0
            ? "Tidak ada buku."
            : `Menampilkan ${from} - ${to} dari ${totalFiltered} buku.`}
        </p>
        <Pagination
          variant="rose"
          total={totalFiltered}
          page={page}
          pageSize={per}
          basePath="/admin/books"
          query={{
            q: qRaw,
            publisher,
            format,
            status: searchParams?.status ?? "",
            min: min != null ? String(min) : "",
            max: max != null ? String(max) : "",
            sort: sortValid ?? "",
            dir: searchParams?.dir?.trim() === "desc" ? "desc" : "",
            per: perQuery(per),
          }}
        />
      </div>
    </>
  );
}

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: Promise<BookSearchParams>;
}) {
  await requireRole("SUPER_ADMIN");
  const sp = scalarize(await searchParams, ["status"]) as BookSearchParams;

  const publisherRows = await db.book.findMany({
    where: { publisher: { not: null } },
    select: { publisher: true },
    distinct: ["publisher"],
    orderBy: { publisher: "asc" },
  });
  const publisherOptions = publisherRows
    .map((r) => r.publisher)
    .filter((p): p is string => Boolean(p));

  return (
    <div className="space-y-4 px-2 md:px-6 [--border:0_55%_87%] [--input:0_55%_87%]">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-[#F3CFCF] bg-gradient-to-br from-[#FDF0F0] to-[#F9DEDE] p-4 shadow-sm md:border-0 md:bg-none md:p-0 md:shadow-none">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <BookOpen className="h-6 w-6 text-[#D97A7A]" />
            Daftar Buku
          </h2>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Kelola koleksi buku di CuratedByDer. Tambah, ubah, atau hapus buku dengan mudah.
          </p>
        </div>
        <NavActionButton
          href="/admin/books/new"
          icon={<Plus className="h-4 w-4" />}
          className="h-9 shrink-0 gap-1.5 rounded-md bg-[#D97A7A] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#c9686b] hover:text-white sm:h-11 sm:gap-2 sm:px-5 sm:text-[15px]"
        >
          Tambah Buku
        </NavActionButton>
      </div>

      <Suspense fallback={<ListLoader compact label="Memuat ringkasan..." />}>
        <BooksStats searchParams={sp} />
      </Suspense>

      <MobileBookFilters basePath="/admin/books" publisherOptions={publisherOptions} />

      <div className="hidden items-center gap-2 lg:flex">
        <div className="min-w-0 flex-1">
          <SearchInput
            basePath="/admin/books"
            placeholder="Masukkan judul buku..."
            inputClassName="bg-white text-[15px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BookFilter
            basePath="/admin/books"
            className="w-full sm:w-auto"
            triggerClassName="bg-white text-[15px] text-black hover:bg-[#FED6D6] hover:text-black"
          />
          <PublisherSelect basePath="/admin/books" options={publisherOptions} />
          <BookSortSelect basePath="/admin/books" />
          <PageSizeSelect basePath="/admin/books" />
        </div>
      </div>

      <Suspense fallback={<ListLoader />}>
        <BooksList searchParams={sp} />
      </Suspense>
    </div>
  );
}
