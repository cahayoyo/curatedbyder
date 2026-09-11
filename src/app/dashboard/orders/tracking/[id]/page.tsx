import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ChevronRight, MapPin, Truck } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { buyerOrderInclude, toBuyerOrderDTO } from "@/lib/orderDto";
import { BuyerShell } from "@/components/BuyerShell";
import { CopyResi, TrackCard } from "@/components/BuyerTabs";
import { earliestEta, StageStatusBanner } from "@/components/TrackingTimeline";
import { etaLabel } from "@/lib/orderOptions";

export default async function TrackingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("USER");

  const order = await db.order.findFirst({
    where: { id, buyerId: session.user.id },
    include: buyerOrderInclude,
  });
  if (!order) notFound();

  const dto = toBuyerOrderDTO(order);
  const eta = earliestEta(dto.items);

  return (
    <BuyerShell>
      <div className="space-y-4">
        <div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/dashboard/orders" className="transition-colors hover:text-[#D97A7A]">
              Pesanan
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-[#B04A4A]">Lacak Pesanan</span>
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <Truck className="h-6 w-6 text-[#D97A7A]" />
            Lacak Pesanan
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau perjalanan buku dan mainanmu sampai ke tanganmu.
          </p>
        </div>

        <TrackCard order={dto} variant="detail" />

        <StageStatusBanner items={dto.items} />

        <div className="rounded-xl border border-[#F0CBCB]/60 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold">Detail Pengiriman</h3>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="space-y-2.5 text-sm">
              <p className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-muted-foreground">No. Resi</span>
                <CopyResi value={dto.trackingNumber} />
              </p>
              <p className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-muted-foreground">Estimasi Tiba</span>
                <span className="font-semibold">{etaLabel(eta)}</span>
              </p>
            </div>

            <div className="space-y-2.5 text-sm">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Alamat Pengiriman
                </p>
                <p className="mt-1 font-medium">{dto.buyerContact || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 rounded-xl border border-[#F0CBCB]/60 bg-[#FBE6E6]/70 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#C96A6A]" />
          <div>
            <p className="text-sm font-semibold text-[#B04A4A]">Informasi</p>
            <p className="mt-0.5 text-xs text-black/60">
              Status pengiriman diperbarui secara otomatis. Jika ada pertanyaan, silakan hubungi
              kami.
            </p>
          </div>
        </div>
      </div>
    </BuyerShell>
  );
}
