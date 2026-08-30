import { db } from "@/lib/db";
import { Fragment, Suspense } from "react";
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
  BookPlus,
  Pencil,
  BookOpen,
  Package,
  ListOrdered,
  Banknote,
  Boxes,
  Hand,
  Tag,
  Building2,
  Info,
  ImageIcon,
  CircleCheckBig,
  PackageCheck,
  Clock,
  ShoppingCart,
} from "lucide-react";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { NavActionButton } from "@/components/NavActionButton";
import { SearchInput } from "@/components/SearchInput";
import { PageSizeSelect } from "@/components/PageSizeSelect";
import { BookFilter } from "@/components/BookFilter";
import { SortButton } from "@/components/SortButton";
import { formatIDR } from "@/lib/format";
import { deleteBook } from "@/server/actions/books";
import { Pagination } from "@/components/Pagination";
import { BookThumbnail } from "@/components/BookThumbnail";
import { BookCard } from "@/components/BookCard";
import { FormatBadge } from "@/components/FormatBadge";
import { ListLoader } from "@/components/ListLoader";
import { cn, stockBadgeClass } from "@/lib/utils";
import { parsePerPage, perQuery } from "@/lib/pagination";

type BookSearchParams = { q?: string; bookQ?: string; page?: string; per?: string; status?: string; min?: string; max?: string; sort?: string; dir?: string };

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

  const minRaw = Number(searchParams?.min);
  const maxRaw = Number(searchParams?.max);
  const min = Number.isFinite(minRaw) && minRaw >= 0 ? Math.floor(minRaw) : null;
  const max = Number.isFinite(maxRaw) && maxRaw >= 0 ? Math.floor(maxRaw) : null;

  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);

  const where: {
    OR?: { title?: { contains: string; mode: "insensitive" }; publisher?: { contains: string; mode: "insensitive" } }[];
    status?: { in: ("READY_STOCK" | "PRE_ORDER")[] };
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
  if (min != null || max != null) {
    where.price = {};
    if (min != null) where.price.gte = min;
    if (max != null) where.price.lte = max;
  }

  return { q, qRaw, sortValid, dir, orderBy, min, max, statuses, where, page };
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

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div className="col-span-2 rounded-lg border p-4 sm:col-span-1">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          Total Buku
        </p>
        <p className="text-2xl font-bold">{totalFiltered}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <PackageCheck className="h-4 w-4" />
          Total Buku Ready Stok
        </p>
        <p className="text-2xl font-bold">{readyCount}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Total Buku Pre Order
        </p>
        <p className="text-2xl font-bold">{preOrderCount}</p>
      </div>
    </div>
  );
}

async function BookOrderCount({ searchParams }: { searchParams: BookSearchParams }) {
  const bookQ = (searchParams?.bookQ ?? "").trim();

  const books = bookQ
    ? await db.book.findMany({
        where: { title: { contains: bookQ, mode: "insensitive" } },
        orderBy: { title: "asc" },
        take: 5,
      })
    : [];

  const orderCounts = new Map<string, number>();
  if (books.length > 0) {
    const items = await db.orderItem.findMany({
      where: { bookId: { in: books.map((b) => b.id) } },
      select: { bookId: true, orderId: true },
    });
    const seen = new Map<string, Set<string>>();
    for (const item of items) {
      if (!item.bookId) continue;
      const set = seen.get(item.bookId) ?? new Set<string>();
      set.add(item.orderId);
      seen.set(item.bookId, set);
    }
    for (const b of books) orderCounts.set(b.id, seen.get(b.id)?.size ?? 0);
  }

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <ShoppingCart className="h-4 w-4" />
        Total Pesanan Buku
      </p>
      <div className="w-full md:w-1/2">
        <SearchInput basePath="/admin/books" paramKey="bookQ" placeholder="Masukkan judul buku..." />
      </div>
      {bookQ && (
        <div className="mt-3 rounded-lg border p-4">
          {books.length === 0 ? (
            <p className="text-sm text-muted-foreground">Buku tidak ditemukan</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {books.map((b) => (
                <li key={b.id} className="flex justify-between">
                  <span>{b.title}</span>
                  <span className="font-medium">{orderCounts.get(b.id) ?? 0} pesanan</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

async function BooksList({ searchParams }: { searchParams: BookSearchParams }) {
  const { qRaw, sortValid, dir, orderBy, min, max, where, page } = parseFilters(searchParams);
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

  return (
    <>
      {/* Mobile: card layout */}
      <div className="space-y-3 md:hidden">
        {books.map((b) => (
          <BookCard
            key={b.id}
            book={{
              id: b.id,
              title: b.title,
              image: b.image,
              publisher: b.publisher,
              info: b.info,
              formats: b.formats as string[],
              price: b.price,
              stock: b.stock,
              status: b.status,
            }}
            onDelete={deleteBook.bind(null, b.id)}
          />
        ))}
        {books.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            Belum ada buku.
          </div>
        )}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-b border-input" style={{ backgroundColor: "#F2F1ED" }}>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <ListOrdered className="h-3.5 w-3.5" />
                  <SortButton label="Judul" column="title" currentSort={sortValid} currentDir={dir} basePath="/admin/books" query={{ q: qRaw, status: searchParams?.status ?? "", min: min != null ? String(min) : "", max: max != null ? String(max) : "", per: searchParams?.per ?? "" }} />
                </span>
              </TableHead>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Gambar
                </span>
              </TableHead>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  <SortButton label="Publisher" column="publisher" currentSort={sortValid} currentDir={dir} basePath="/admin/books" query={{ q: qRaw, status: searchParams?.status ?? "", min: min != null ? String(min) : "", max: max != null ? String(max) : "", per: searchParams?.per ?? "" }} />
                </span>
              </TableHead>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  Informasi
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
                  <SortButton label="Harga" column="price" type="num" currentSort={sortValid} currentDir={dir} basePath="/admin/books" query={{ q: qRaw, status: searchParams?.status ?? "", min: min != null ? String(min) : "", max: max != null ? String(max) : "", per: searchParams?.per ?? "" }} />
                </span>
              </TableHead>
              <TableHead className="font-bold">
                <span className="flex items-center gap-1">
                  <Boxes className="h-3.5 w-3.5" />
                  <SortButton label="Stok" column="stock" type="num" currentSort={sortValid} currentDir={dir} basePath="/admin/books" query={{ q: qRaw, min: min != null ? String(min) : "", max: max != null ? String(max) : "", status: searchParams?.status ?? "", per: searchParams?.per ?? "" }} />
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
                  <Hand className="h-3.5 w-3.5" />
                  Aksi
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((b) => {
              const variants: {
                key: string;
                label: string;
                formats: string[];
                price: number;
              }[] = [
                {
                  key: `${b.id}-main`,
                  label: "Utama",
                  formats: (b.formats ?? []) as string[],
                  price: b.price,
                },
                ...b.batchPrices.map((bp) => ({
                  key: bp.id,
                  label: bp.batch.name,
                  formats: (bp.formats ?? []) as string[],
                  price: bp.price,
                })),
              ];
              return (
                <Fragment key={b.id}>
                  {variants.map((v, vi) => (
                    <TableRow
                      key={v.key}
                      className={`border-b border-input last:border-0 ${vi > 0 ? "border-t-2 border-t-black/30" : ""}`}
                    >
                      {vi === 0 && (
                        <>
                          <TableCell className="font-medium" rowSpan={variants.length}>
                            {b.title}
                          </TableCell>
                          <TableCell rowSpan={variants.length}>
                            {b.image ? (
                              <BookThumbnail src={b.image} alt={b.title} />
                            ) : (
                              <div className="flex h-32 w-28 items-center justify-center rounded border-2 border-dashed border-[#D97A7A]/50 bg-[#FED6D6]/20 text-xs font-medium text-[#D97A7A]/70">
                                <span className="flex flex-col items-center gap-1">
                                  <ImageIcon className="h-7 w-7" />
                                  empty
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell rowSpan={variants.length}>{b.publisher || "—"}</TableCell>
                          <TableCell className="max-w-[200px]" rowSpan={variants.length}>
                            <span className="line-clamp-2 text-sm">{b.info || "—"}</span>
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <span className="flex flex-wrap gap-1">
                            {v.formats.length > 0 ? (
                              v.formats.map((f) => <FormatBadge key={f} value={f} />)
                            ) : (
                              <span>—</span>
                            )}
                          </span>
                          {variants.length > 1 && (
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {v.label}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatIDR(v.price)}
                      </TableCell>
                      {vi === 0 && (
                        <>
                          <TableCell className="border-l border-input text-center" rowSpan={variants.length}>
                            <Badge
                              variant="outline"
                              className={cn(
                                stockBadgeClass(b.stock),
                                "h-6 w-9 justify-center px-0 text-xs"
                              )}
                            >
                              {b.stock}
                            </Badge>
                          </TableCell>
                          <TableCell className="border-l border-input" rowSpan={variants.length}>
                            <Badge
                              variant="outline"
                              className={
                                b.status === "PRE_ORDER"
                                  ? "border-amber-300 bg-yellow-300 text-yellow-900"
                                  : "border-emerald-300 bg-emerald-100 text-emerald-800"
                              }
                            >
                              {b.status === "PRE_ORDER" ? "Pre Order" : "Ready Stok"}
                            </Badge>
                          </TableCell>
                          <TableCell className="border-l border-input text-center" rowSpan={variants.length}>
                            <div className="flex justify-center gap-2">
                              <NavActionButton
                                href={`/admin/books/${b.id}/edit`}
                                icon={<Pencil className="h-3.5 w-3.5" />}
                                className="h-9 border border-input bg-transparent px-3 text-xs text-black shadow-sm transition-colors hover:bg-yellow-400 hover:text-black"
                              >
                                Ubah
                              </NavActionButton>
                              <ConfirmDeleteButton
                                title="Konfirmasi Hapus"
                                description={`Apakah anda benar ingin menghapus buku "${b.title}"?`}
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
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Belum ada buku.
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
          pageSize={per}
          basePath="/admin/books"
          query={{
            q: qRaw,
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

export default function AdminBooksPage({
  searchParams,
}: {
  searchParams: BookSearchParams;
}) {
  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <BookOpen className="h-6 w-6" />
            Daftar Buku
          </h2>
          <NavActionButton
            href="/admin/books/new"
            icon={<BookPlus className="h-4 w-4" />}
            className="border border-input bg-black px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#D97A7A] hover:text-white"
          >
            Tambah Buku
          </NavActionButton>
        </div>

        <Suspense fallback={<ListLoader compact label="Memuat ringkasan..." />}>
          <BooksStats searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={null}>
          <BookOrderCount searchParams={searchParams} />
        </Suspense>

        <div className="flex flex-col gap-2 md:flex-row md:items-start">
          <div className="flex w-full items-center gap-2 md:w-[80%]">
            <div className="w-full">
              <SearchInput basePath="/admin/books" placeholder="Cari judul / publisher..." />
            </div>
            <PageSizeSelect basePath="/admin/books" />
          </div>
          <BookFilter basePath="/admin/books" className="w-full md:order-first md:w-[20%]" />
        </div>

        <Suspense fallback={<ListLoader />}>
          <BooksList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}