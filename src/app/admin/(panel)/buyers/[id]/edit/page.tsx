import Link from "next/link";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { BuyerForm } from "@/components/BuyerForm";

export default async function EditBuyerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buyer = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true, contact: true },
  });
  if (!buyer) notFound();

  return (
    <div className="space-y-4 px-2 md:px-6 [--border:0_55%_87%] [--input:0_55%_87%]">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/admin/buyers" className="transition-colors hover:text-black">
          Pembeli
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-black">Ubah Pembeli</span>
      </nav>

      <div className="flex items-start gap-3">
        <Link
          href="/admin/buyers"
          aria-label="Kembali"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F0CBCB] bg-white text-[#C96A6A] transition-colors hover:bg-[#FED6D6]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Ubah Pembeli</h2>
          <p className="text-base text-muted-foreground">{buyer.name}</p>
        </div>
      </div>

      <BuyerForm
        initial={{
          id: buyer.id,
          name: buyer.name,
          phone: buyer.phone ?? "",
          contact: buyer.contact,
        }}
      />
    </div>
  );
}
