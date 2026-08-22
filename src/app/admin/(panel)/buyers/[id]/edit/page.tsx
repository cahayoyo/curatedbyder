import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BuyerForm } from "@/components/BuyerForm";

export default async function EditBuyerPage({
  params,
}: {
  params: { id: string };
}) {
  const buyer = await db.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, phone: true, contact: true },
  });
  if (!buyer) notFound();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Ubah Pembeli: {buyer.name}</h2>
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
