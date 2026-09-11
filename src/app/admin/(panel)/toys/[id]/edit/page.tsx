import Link from "next/link";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { ToyForm } from "@/components/ToyForm";
import { getBatches } from "@/server/queries/catalog";

export default async function EditToyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [toy, batches] = await Promise.all([
    db.toy.findUnique({
      where: { id },
      include: { batchPrices: { select: { batchId: true, price: true } } },
    }),
    getBatches(),
  ]);
  if (!toy) notFound();

  return (
    <div className="space-y-4 px-2 md:px-6 [--border:0_55%_87%] [--input:0_55%_87%]">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/admin/toys" className="transition-colors hover:text-black">
          Mainan
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-black">Ubah Mainan</span>
      </nav>

      <div className="flex items-start gap-3">
        <Link
          href="/admin/toys"
          aria-label="Kembali"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F0CBCB] bg-white text-[#C96A6A] transition-colors hover:bg-[#FED6D6]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Ubah Mainan</h2>
          <p className="text-base text-muted-foreground">{toy.title}</p>
        </div>
      </div>

      <ToyForm
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
        initial={{
          id: toy.id,
          title: toy.title,
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
