import { Prisma } from "@prisma/client";
import type { OrderDTO } from "@/components/BuyerTabs";

export const buyerOrderInclude = {
  buyer: { select: { name: true, phone: true, contact: true } },
  items: {
    orderBy: { id: "asc" },
    include: {
      batch: { select: { name: true } },
      book: { select: { title: true, formats: true, image: true } },
      toy: { select: { title: true, image: true } },
    },
  },
} satisfies Prisma.OrderInclude;

export type BuyerOrderWithItems = Prisma.OrderGetPayload<{ include: typeof buyerOrderInclude }>;

export function toBuyerOrderDTO(s: BuyerOrderWithItems): OrderDTO {
  return {
    id: s.id,
    invoiceNumber: s.invoiceNumber,
    paymentStatus: s.paymentStatus,
    total: s.total,
    soldAt: s.soldAt.toISOString(),
    dp: s.dp,
    remaining: s.remaining ?? Math.max(0, s.total - (s.dp ?? 0)),
    shippingCost: s.shippingCost,
    trackingNumber: s.trackingNumber,
    buyerName: s.buyer.name,
    buyerPhone: s.buyer.phone,
    buyerContact: s.buyer.contact,
    items: s.items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.quantity * i.unitPrice,
      status: i.status,
      batchId: i.batchId,
      batchName: i.batch?.name ?? null,
      eta: i.eta,
      kind: i.book ? "BUKU" : i.toy ? "MAINAN" : "LAINNYA",
      image: i.book?.image ?? i.toy?.image ?? null,
      stages: [
        i.placedAt,
        i.shippingToIndonesiaAt,
        i.arrivedInIndonesiaAt,
        i.arrivedAtWarehouseAt,
        i.shippedToCustomerAt,
        i.deliveredAt,
      ].map((d) => d?.toISOString() ?? null),
      book: {
        title: i.book?.title ?? i.toy?.title ?? "—",
        formats: i.book?.formats ?? [],
      },
    })),
  };
}
