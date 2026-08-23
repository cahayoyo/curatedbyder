import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ToyForm } from "@/components/ToyForm";

export default async function EditToyPage({ params }: { params: { id: string } }) {
  const [toy, batches] = await Promise.all([
    db.toy.findUnique({
      where: { id: params.id },
      include: { batchPrices: { select: { batchId: true, price: true } } },
    }),
    db.batch.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!toy) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold">Ubah Mainan: {toy.title}</h2>
      <ToyForm
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
        initial={{
          id: toy.id,
          title: toy.title,
          publisher: toy.publisher,
          info: toy.info,
          image: toy.image,
          price: toy.price,
          stock: toy.stock,
          status: toy.status,
          batchPrices: toy.batchPrices.map((bp) => ({ batchId: bp.batchId, price: bp.price })),
        }}
      />
    </div>
  );
}