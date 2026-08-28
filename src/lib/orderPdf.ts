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
    tipe: string;
    formats: string[];
    status: string;
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

  const logo = order.logoBase64;
  let titleX = margin;
  if (logo) {
    doc.addImage(`data:image/jpeg;base64,${logo}`, "JPEG", margin, 9, 10, 10);
    titleX = margin + 13;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detail Pesanan", titleX, 17);

  doc.setFontSize(10);
  const infoRowsLeft: [string, string][] = [
    ["Invoice", order.invoiceNumber],
    ["Pembeli", order.buyer.name],
  ];
  const infoRowsRight: [string, string][] = [
    ["Tanggal", dateLabel(order.soldAt)],
    ["No HP", order.buyer.phone || "—"],
  ];
  const rightX = 105;
  infoRowsLeft.forEach(([label, value], i) => {
    infoText(doc, label, value, 28 + i * 5.2, labelW);
  });
  infoRowsRight.forEach(([label, value], i) => {
    infoText(doc, label, value, 28 + i * 5.2, labelW, rightX);
  });

  autoTable(doc, {
    startY: 40 + infoRowsLeft.length * 5.2,
    head: [["#", "Nama Produk", "Tipe", "Format", "Batch", "ETA", "Status Pesanan", "Qty", "Harga", "Subtotal"]],
    body: order.items.map((it, i) => [
      String(i + 1),
      it.title,
      it.tipe,
      it.formats.length ? it.formats.join(", ") : "—",
      it.batchName ?? "—",
      etaLabel(it.eta),
      it.status === "PRE_ORDER" ? "Pre Order" : "Ready Stok",
      String(it.quantity),
      formatIDR(it.unitPrice),
      formatIDR(it.subtotal),
    ]),
    foot: [
      [{ content: "DP", colSpan: 9, styles: { halign: "right" } }, formatIDR(order.dp ?? 0)],
      [{ content: "Sisa", colSpan: 9, styles: { halign: "right" } }, formatIDR(order.remaining ?? 0)],
      [{ content: "Ongkir", colSpan: 9, styles: { halign: "right" } }, order.shippingCost != null ? formatIDR(order.shippingCost) : "—"],
      [{ content: "Total", colSpan: 9, styles: { halign: "right" } }, formatIDR(order.total)],
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
      3: { cellWidth: 16 },
      4: { cellWidth: 18 },
      5: { cellWidth: 17 },
      6: { cellWidth: 22 },
      7: { cellWidth: 9, halign: "center" },
      8: { cellWidth: 23, halign: "right" },
      9: { cellWidth: 27, halign: "right" },
    },
    theme: "grid",
  });

  const lastY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY + 14;

  doc.setFontSize(10);
  infoText(doc, "Status Bayar", PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus, lastY, labelW);
  infoText(doc, "No Resi", order.trackingNumber || "--", lastY + 6, labelW);

  return doc;
}