import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatIDR, dateLabel } from "@/lib/format";
import { STATUS_LABEL, PAYMENT_LABEL, etaLabel } from "@/lib/orderOptions";

type OrderPdfDTO = {
  invoiceNumber: string;
  soldAt: Date;
  buyer: { name: string; phone: string | null; contact: string | null };
  batch: { name: string } | null;
  eta: string | null;
  items: {
    book: { title: string; formats: string[]; status: "READY_STOCK" | "PRE_ORDER" };
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  total: number;
  dp: number | null;
  remaining: number | null;
  shippingCost: number | null;
  trackingNumber: string | null;
  paymentStatus: string;
  status: string;
};

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
  doc.text(`Batch     : ${order.batch?.name || "—"}`, margin, 57);
  doc.text(`ETA       : ${etaLabel(order.eta)}`, margin, 61);

  autoTable(doc, {
    startY: 74,
    head: [["#", "Judul Buku", "Format", "Status", "Qty", "Harga", "Subtotal"]],
    body: order.items.map((it, i) => [
      String(i + 1),
      it.book.title,
      it.book.formats.length ? it.book.formats.join(", ") : "—",
      it.book.status === "PRE_ORDER" ? "Pre Order" : "Ready Stok",
      String(it.quantity),
      formatIDR(it.unitPrice),
      formatIDR(it.subtotal),
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [217, 122, 122] },
    columnStyles: {
      0: { cellWidth: 8 },
      4: { cellWidth: 12, halign: "center" },
      5: { cellWidth: 30, halign: "right" },
      6: { cellWidth: 32, halign: "right" },
    },
    theme: "grid",
  });

  const lastY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.text(`Total : ${formatIDR(order.total)}`, pageWidth - margin, lastY, { align: "right" });
  doc.text(`DP    : ${formatIDR(order.dp ?? 0)}`, pageWidth - margin, lastY + 6, { align: "right" });
  doc.text(`Sisa  : ${formatIDR(order.remaining ?? 0)}`, pageWidth - margin, lastY + 12, { align: "right" });
  doc.text(`Ongkir: ${order.shippingCost != null ? formatIDR(order.shippingCost) : "--"}`, pageWidth - margin, lastY + 18, { align: "right" });

  doc.setFontSize(9);
  doc.text(`Status Bayar : ${PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus}`, margin, lastY + 12);
  doc.text(`Status Order : ${STATUS_LABEL[order.status] || order.status}`, margin, lastY + 17);
  doc.text(`No Resi      : ${order.trackingNumber || "--"}`, margin, lastY + 22);

  return doc;
}