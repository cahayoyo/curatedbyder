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
  payments?: { amount: number }[];
};

const LABEL_X = 14;
const VALUE_GAP = 3;
const RED: [number, number, number] = [220, 38, 38];

const ROMANS = ["II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function pembayaranLabel(i: number): string {
  return `Pembayaran ${ROMANS[i] ?? String(i + 2)}`;
}

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
  const BANK_GAP = 4;
  infoRowsLeft.forEach(([label, value], i) => {
    infoText(doc, label, value, INFO_Y + i * 5.2, labelW);
  });
  infoRowsRight.forEach(([label, value], i) => {
    infoText(doc, label, value, INFO_Y + i * 5.2, labelW, rightX);
  });

  autoTable(doc, {
    startY: INFO_Y + infoRowsLeft.length * 5.2 + BANK_GAP,
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
      [{ content: "Total", colSpan: 7, styles: { halign: "right" } }, formatIDR(order.total)],
      [{ content: "", colSpan: 8 }],
      [{ content: "Ongkos Kirim", colSpan: 7, styles: { halign: "right" } }, order.shippingCost != null ? formatIDR(order.shippingCost) : "—"],
      [{ content: "Pembayaran I", colSpan: 7, styles: { halign: "right" } }, formatIDR(order.dp ?? 0)],
      ...(order.payments ?? []).map((p, i) => [
        { content: pembayaranLabel(i), colSpan: 7, styles: { halign: "right" as const } },
        formatIDR(p.amount),
      ]),
      [
        { content: "Sisa Tagihan", colSpan: 7, styles: { halign: "right", textColor: RED } },
        { content: formatIDR(order.remaining ?? 0), styles: { halign: "right", textColor: RED } },
      ],
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

  let bankY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  if (bankY + 17.5 > pageH - 14) {
    doc.addPage();
    bankY = 26;
  }

  const CARD_TOP = bankY - 5.5;
  const CARD_H = 22.5;
  doc.setFillColor(253, 242, 242);
  doc.setDrawColor(247, 213, 213);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, CARD_TOP, pageW - 2 * margin, CARD_H, 3, 3, "FD");

  const cx = margin + 8.5;
  const cy = CARD_TOP + CARD_H / 2;
  doc.setFillColor(217, 122, 122);
  doc.circle(cx, cy, 6, "F");
  doc.setFillColor(255, 255, 255);
  doc.triangle(cx - 5, cy - 1.4, cx, cy - 4.4, cx + 5, cy - 1.4, "F");
  doc.rect(cx - 3.4, cy - 0.6, 1.1, 3.4, "F");
  doc.rect(cx - 0.55, cy - 0.6, 1.1, 3.4, "F");
  doc.rect(cx + 2.3, cy - 0.6, 1.1, 3.4, "F");
  doc.rect(cx - 5, cy + 3.2, 10, 1.2, "F");

  const MAROON: [number, number, number] = [154, 61, 61];
  const DARK: [number, number, number] = [55, 55, 55];
  const GRAY: [number, number, number] = [130, 130, 130];
  const textX = margin + 17;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...MAROON);
  doc.text("Transfer hanya melalui rekening :", textX, bankY);

  doc.setFontSize(9.5);
  doc.text("BANK BCA", textX, bankY + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.text("8990789330", textX + 27, bankY + 7);
  doc.setTextColor(...GRAY);
  doc.setFontSize(8.5);
  doc.text("Adera Nurul", textX + 57, bankY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...MAROON);
  doc.text("BANK JAGO", textX, bankY + 13.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.text("103600160006", textX + 27, bankY + 13.5);
  doc.setTextColor(...GRAY);
  doc.setFontSize(8.5);
  doc.text("Adera Nurul", textX + 57, bankY + 13.5);

  doc.setFillColor(235, 235, 235);
  doc.rect(0, pageH - 12, pageW, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(217, 122, 122);
  doc.text("curatedbyder.store", pageW / 2, pageH - 4.5, { align: "center" });

  return doc;
}