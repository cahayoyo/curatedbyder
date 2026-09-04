import { getBatches } from "@/server/queries/catalog";
import { BookForm } from "@/components/BookForm";

export default async function NewBookPage() {
  const batches = await getBatches();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold">Buat Buku</h2>
      <BookForm batches={batches.map((b) => ({ id: b.id, name: b.name }))} />
    </div>
  );
}
