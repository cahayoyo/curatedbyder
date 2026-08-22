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
import { BookPlus, Pencil, BookOpen, Package, ListOrdered, Banknote, Boxes, Hand, Tag } from "lucide-react";
import { DeleteBookButton } from "@/components/DeleteBookButton";
import { NavActionButton } from "@/components/NavActionButton";
import { BookSearch } from "@/components/BookSearch";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 20;

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const qRaw = (searchParams?.q ?? "").trim();
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const where = q ? { title: { contains: q, mode: "insensitive" as const } } : undefined;

  const [totalBooks, totalFiltered, books] = await Promise.all([
    db.book.count(),
    db.book.count({ where }),
    db.book.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalStock = await db.book.aggregate({ _sum: { stock: true } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <BookOpen className="h-6 w-6" />
          Daftar Buku
        </h2>
        <NavActionButton
          href="/admin/books/new"
          icon={<BookPlus className="h-4 w-4" />}
          className="border border-input shadow-sm transition-colors hover:bg-[#FED6D6] hover:text-black"
        >
          Tambah Buku
        </NavActionButton>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            Total Buku
          </p>
          <p className="text-2xl font-bold">{totalBooks}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Boxes className="h-4 w-4" />
            Total Stok
          </p>
          <p className="text-2xl font-bold">{totalStock._sum.stock ?? 0}</p>
        </div>
      </div>

      <div className="w-full md:max-w-md">
        <BookSearch />
      </div>

      <div className="rounded-lg border">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-b border-input" style={{ backgroundColor: "#F2F1ED" }}>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1">
                    <ListOrdered className="h-3.5 w-3.5" />
                    Judul
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
                    Harga
                  </span>
                </TableHead>
              <TableHead className="font-bold">
                  <span className="flex items-center gap-1">
                    <Boxes className="h-3.5 w-3.5" />
                    Stok
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
            {books.map((b) => (
              <TableRow key={b.id} className="border-b border-input last:border-0">
                <TableCell className="font-medium">{b.title}</TableCell>
                <TableCell>
                  {b.formats.length > 0 ? b.formats.join(", ") : "—"}
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(b.price)}
                </TableCell>
                <TableCell>
                  <Badge variant={b.stock <= 5 ? "destructive" : "default"}>{b.stock}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <NavActionButton
                      href={`/admin/books/${b.id}/edit`}
                      icon={<Pencil className="h-3.5 w-3.5" />}
                      className="h-9 border border-input bg-transparent px-3 text-xs text-black shadow-sm transition-colors hover:bg-yellow-400 hover:text-black"
                    >
                      Ubah
                    </NavActionButton>
                    <DeleteBookButton id={b.id} title={b.title} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {books.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No books yet.
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
        basePath="/admin/books"
        query={{ q: qRaw }}
      />
    </div>
  );
}