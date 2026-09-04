import { getBatches } from "@/server/queries/catalog";
import { ToyForm } from "@/components/ToyForm";

export default async function NewToyPage() {
  const batches = await getBatches();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold">Buat Mainan</h2>
      <ToyForm batches={batches.map((b) => ({ id: b.id, name: b.name }))} />
    </div>
  );
}
