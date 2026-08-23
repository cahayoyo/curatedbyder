import { db } from "@/lib/db";
import { ToyForm } from "@/components/ToyForm";

export default async function NewToyPage() {
  const batches = await db.batch.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold">Buat Toy</h2>
      <ToyForm batches={batches.map((b) => ({ id: b.id, name: b.name }))} />
    </div>
  );
}