import { db } from "@/lib/db";
import { buildOrderPdf } from "@/lib/orderPdf";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id || !/^[a-zA-Z0-9_-]{8,}$/.test(id)) {
    return new NextResponse("Order not found", { status: 404 });
  }

  const order = await db.order.findUnique({
    where: { id },
    include: {
      buyer: { select: { name: true, phone: true, contact: true } },
      batch: { select: { name: true } },
      items: {
        include: {
          book: { select: { title: true, formats: true, status: true } },
          toy: { select: { title: true, status: true } },
        },
      },
    },
  });

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  const dto = {
    ...order,
    items: order.items.map((it) => ({
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      subtotal: it.subtotal,
      book: {
        title: it.book?.title ?? it.toy?.title ?? "—",
        formats: it.book?.formats ?? [],
        status: (it.book ?? it.toy)?.status ?? "PRE_ORDER",
      },
    })),
  };

  const doc = buildOrderPdf(dto);
  const buf = doc.output("arraybuffer");

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="pesanan-${order.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}