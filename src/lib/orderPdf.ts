import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatIDR, dateLabel } from "@/lib/format";
import { PAYMENT_LABEL, etaLabel } from "@/lib/orderOptions";

type OrderPdfDTO = {
  invoiceNumber: string;
  soldAt: Date;
  logoBase64?: string;
  buyer: { name: string; phone: string | null };
  items: {
    title: string;
    formats: string[];
    batchName: string | null;
    eta: string;
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
};

const LABEL_X = 14;
const VALUE_GAP = 3;

function infoText(doc: jsPDF, label: string, value: string, y: number, labelW: number, x = LABEL_X) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(label, x, y);
  doc.text(`: ${value}`, x + labelW + VALUE_GAP, y);
}

export function buildOrderPdf(order: OrderPdfDTO) {
  const doc = new jsPDF();
  const margin = 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const labelW = doc.getTextWidth("Status Bayar");

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const logo = order.logoBase64;
  if (logo) {
    doc.addImage(`data:image/jpeg;base64,${logo}`, "JPEG", margin, 9, 22, 22);
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detail Pesanan", pageW - margin, 22, { align: "right" });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, 33.5, pageW - margin, 33.5);

  doc.setFontSize(10);
  const infoRowsLeft: [string, string][] = [
    ["Invoice", order.invoiceNumber],
    ["Pembeli", order.buyer.name],
    ["Status Bayar", PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus],
  ];
  const infoRowsRight: [string, string][] = [
    ["Tanggal", dateLabel(order.soldAt)],
    ["No HP", order.buyer.phone || "—"],
    ["No Resi", order.trackingNumber || "--"],
  ];
  const rightX = 105;
  const INFO_Y = 40;
  infoRowsLeft.forEach(([label, value], i) => {
    infoText(doc, label, value, INFO_Y + i * 5.2, labelW);
  });
  infoRowsRight.forEach(([label, value], i) => {
    infoText(doc, label, value, INFO_Y + i * 5.2, labelW, rightX);
  });

  autoTable(doc, {
    startY: 40 + infoRowsLeft.length * 5.2,
    head: [["#", "Nama Produk", "Format", "Batch", "ETA", "Qty", "Harga", "Subtotal"]],
    body: order.items.map((it, i) => [
      String(i + 1),
      it.title,
      it.formats.length ? it.formats.join(", ") : "—",
      it.batchName ?? "—",
      etaLabel(it.eta),
      String(it.quantity),
      formatIDR(it.unitPrice),
      formatIDR(it.subtotal),
    ]),
    foot: [
      [{ content: "DP", colSpan: 7, styles: { halign: "right" } }, formatIDR(order.dp ?? 0)],
      [{ content: "Sisa", colSpan: 7, styles: { halign: "right" } }, formatIDR(order.remaining ?? 0)],
      [{ content: "Ongkir", colSpan: 7, styles: { halign: "right" } }, order.shippingCost != null ? formatIDR(order.shippingCost) : "—"],
      [{ content: "Total", colSpan: 7, styles: { halign: "right" } }, formatIDR(order.total)],
    ],
    styles: { fontSize: 9, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 },
    headStyles: { fillColor: [217, 122, 122], lineColor: [0, 0, 0], lineWidth: 0.1 },
    footStyles: {
      fillColor: [255, 241, 238],
      fontStyle: "bold",
      halign: "right",
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 8 },
      2: { cellWidth: 16 },
      3: { cellWidth: 18 },
      4: { cellWidth: 17 },
      5: { cellWidth: 9, halign: "center" },
      6: { cellWidth: 23, halign: "right" },
      7: { cellWidth: 27, halign: "right" },
    },
    theme: "grid",
  });

  doc.setFillColor(235, 235, 235);
  doc.rect(0, pageH - 12, pageW, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(217, 122, 122);
  doc.text("curatedbyder.store", pageW / 2, pageH - 4.5, { align: "center" });

  return doc;
}