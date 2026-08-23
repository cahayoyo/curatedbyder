import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatIDR, dateLabel } from "@/lib/format";
import { STATUS_LABEL, PAYMENT_LABEL, etaLabel } from "@/lib/orderOptions";

type OrderPdfDTO = {
  invoiceNumber: string;
  soldAt: Date;
  logoBase64?: string;
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

const LABEL_X = 14;
const VALUE_GAP = 3;

function infoText(doc: jsPDF, label: string, value: string, y: number) {
  doc.setFont("helvetica", "normal");
  doc.text(label, LABEL_X, y);
  const w = doc.getTextWidth(label);
  doc.text(`: ${value}`, LABEL_X + w + VALUE_GAP, y);
}

export function buildOrderPdf(order: OrderPdfDTO) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  const logo = order.logoBase64;
  let titleX = margin;
  if (logo) {
    doc.addImage(`data:image/jpeg;base64,${logo}`, "JPEG", margin, 9, 10, 10);
    titleX = margin + 13;
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Detail Pesanan", titleX, 17);

  doc.setFontSize(10);
  const infoRows: [string, string][] = [
    ["Invoice", order.invoiceNumber],
    ["Tanggal", dateLabel(order.soldAt)],
    ["Pembeli", order.buyer.name],
    ["Phone", order.buyer.phone || "—"],
    ["Alamat", order.buyer.contact || "—"],
    ["Batch", order.batch?.name || "—"],
    ["ETA", etaLabel(order.eta)],
  ];
  infoRows.forEach(([label, value], i) => {
    infoText(doc, label, value, 28 + i * 5.2);
  });

  autoTable(doc, {
    startY: 40 + infoRows.length * 5.2,
    head: [["#", "Nama Produk", "Format", "Status", "Qty", "Harga", "Subtotal"]],
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
    .lastAutoTable.finalY + 6;

  const totals: [string, string, string, string][] = [
    ["DP", "Sisa", "Ongkir", "Total"],
    [
      formatIDR(order.dp ?? 0),
      formatIDR(order.remaining ?? 0),
      order.shippingCost != null ? formatIDR(order.shippingCost) : "—",
      formatIDR(order.total),
    ],
  ];

  const totalWidth = 90;
  const xStart = pageWidth - margin - totalWidth;
  autoTable(doc, {
    startY: lastY + 6,
    head: [totals[0]],
    body: [totals[1]],
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [217, 122, 122], textColor: [255, 255, 255] },
    bodyStyles: { fillColor: [255, 241, 238] },
    columnStyles: {
      0: { halign: "right", cellWidth: 22 },
      1: { halign: "right", cellWidth: 22 },
      2: { halign: "right", cellWidth: 22 },
      3: { halign: "right", cellWidth: 24 },
    },
    margin: { left: xStart, right: margin },
    tableWidth: totalWidth,
  });

  const statusY = lastY + 20;

  doc.setFontSize(10);
  infoText(doc, "Status Bayar", PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus, statusY);
  infoText(doc, "Status Order", STATUS_LABEL[order.status] || order.status, statusY + 6);
  infoText(doc, "No Resi", order.trackingNumber || "--", statusY + 12);

  return doc;
}