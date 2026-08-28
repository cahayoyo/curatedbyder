import { db } from "@/lib/db";
import { buildOrderPdf } from "@/lib/orderPdf";
import { NextRequest, NextResponse } from "next/server";
import { LOGO_BASE64 } from "@/lib/logo";

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
      buyer: { select: { name: true, phone: true } },
      items: {
        orderBy: { id: "asc" },
        include: {
          batch: { select: { name: true } },
          book: { select: { title: true, formats: true } },
          toy: { select: { title: true } },
        },
      },
    },
  });

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  const dto = {
    ...order,
    logoBase64: LOGO_BASE64,
    items: order.items.map((it) => ({
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      subtotal: it.subtotal,
      title: it.book?.title ?? it.toy?.title ?? "—",
      formats: it.book?.formats ?? [],
      batchName: it.batch?.name ?? null,
      eta: it.eta,
    })),
  };

  const doc = buildOrderPdf(dto);
  const buf = doc.output("arraybuffer");

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}