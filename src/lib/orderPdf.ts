import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatIDR, dateLabel } from "@/lib/format";
import { PAYMENT_LABEL, etaLabel } from "@/lib/orderOptions";

type OrderPdfDTO = {
  invoiceNumber: string;
  soldAt: Date;
  logoBase64?: string;
  buyer: { name: string; phone: string | null; contact: string | null };
  items: {
    batchName: string | null;
    eta: string;
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
};

const LABEL_X = 14;
const VALUE_GAP = 3;

function infoText(doc: jsPDF, label: string, value: string, y: number, labelW: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(label, LABEL_X, y);
  doc.text(`: ${value}`, LABEL_X + labelW + VALUE_GAP, y);
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
  ];
  infoRows.forEach(([label, value], i) => {
    infoText(doc, label, value, 28 + i * 5.2, labelW);
  });

  autoTable(doc, {
    startY: 40 + infoRows.length * 5.2,
    head: [["#", "Nama Produk", "Batch", "ETA", "Format", "Status", "Qty", "Harga", "Subtotal"]],
    body: order.items.map((it, i) => [
      String(i + 1),
      it.book.title,
      it.batchName ?? "—",
      etaLabel(it.eta),
      it.book.formats.length ? it.book.formats.join(", ") : "—",
      it.book.status === "PRE_ORDER" ? "Pre Order" : "Ready Stok",
      String(it.quantity),
      formatIDR(it.unitPrice),
      formatIDR(it.subtotal),
    ]),
    foot: [
      ["", "", "", "", "", "", "DP", "", formatIDR(order.dp ?? 0)],
      ["", "", "", "", "", "", "Sisa", "", formatIDR(order.remaining ?? 0)],
      ["", "", "", "", "", "", "Ongkir", "", order.shippingCost != null ? formatIDR(order.shippingCost) : "—"],
      ["", "", "", "", "", "", "Total", "", formatIDR(order.total)],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [217, 122, 122] },
    footStyles: { fillColor: [255, 241, 238], fontStyle: "bold", halign: "right", textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 8 },
      2: { cellWidth: 22 },
      3: { cellWidth: 20 },
      4: { cellWidth: 12 },
      6: { cellWidth: 12, halign: "center" },
      7: { cellWidth: 26, halign: "right" },
      8: { cellWidth: 30, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "foot") {
        data.cell.styles.halign = data.column.index >= 6 ? "right" : "center";
      }
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