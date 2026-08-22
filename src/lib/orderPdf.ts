import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatIDR } from "@/lib/format";
import { STATUSES, PAYMENT_STATUSES, SOURCES, ETAS } from "@/lib/orderOptions";

export type OrderPdfDTO = {
  invoiceNumber: string;
  soldAt: Date;
  buyer: { name: string; phone: string | null; contact: string | null };
  source: string;
  batch: { name: string } | null;
  eta: string | null;
  items: {
    book: { title: string; formats: string[] };
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  total: number;
  dp: number | null;
  remaining: number | null;
  paymentStatus: string;
  status: string;
};

const SOURCE_LABEL: Record<string, string> = Object.fromEntries(
  SOURCES.map((s) => [s.value, s.label])
);
const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s.label])
);
const PAYMENT_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_STATUSES.map((p) => [p.value, p.label])
);

function etaLabel(v: string | null | undefined) {
  if (v == null) return "—";
  return ETAS.find((e) => e.value === v)?.label ?? v;
}

function dateLabel(v: Date) {
  return new Date(v).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function buildOrderPdf(order: OrderPdfDTO) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Detail Pesanan", margin, 18);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice: ${order.invoiceNumber}`, margin, 26);
  doc.text(`Tanggal: ${dateLabel(order.soldAt)}`, margin, 32);

  doc.setFontSize(10);
  doc.text(`Pembeli   : ${order.buyer.name}`, margin, 42);
  doc.text(`Phone     : ${order.buyer.phone || "—"}`, margin, 47);
  doc.text(`Alamat    : ${order.buyer.contact || "—"}`, margin, 52);
  doc.text(`Sumber    : ${SOURCE_LABEL[order.source] || order.source}`, margin, 57);
  doc.text(`Batch     : ${order.batch?.name || "—"}`, margin, 62);
  doc.text(`ETA       : ${etaLabel(order.eta)}`, margin, 66);

  autoTable(doc, {
    startY: 74,
    head: [["#", "Judul Buku", "Format", "Qty", "Harga", "Subtotal"]],
    body: order.items.map((it, i) => [
      String(i + 1),
      it.book.title,
      it.book.formats.length ? it.book.formats.join(", ") : "—",
      String(it.quantity),
      formatIDR(it.unitPrice),
      formatIDR(it.subtotal),
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [217, 122, 122] },
    columnStyles: {
      0: { cellWidth: 8 },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 32, halign: "right" },
    },
    theme: "grid",
  });

  const lastY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.text(`Total : ${formatIDR(order.total)}`, pageWidth - margin, lastY, { align: "right" });
  doc.text(`DP    : ${formatIDR(order.dp ?? 0)}`, pageWidth - margin, lastY + 6, { align: "right" });
  doc.text(`Sisa  : ${formatIDR(order.remaining ?? 0)}`, pageWidth - margin, lastY + 12, { align: "right" });

  doc.setFontSize(9);
  doc.text(`Status Bayar : ${PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus}`, margin, lastY + 12);
  doc.text(`Status Order : ${STATUS_LABEL[order.status] || order.status}`, margin, lastY + 17);

  return doc;
}