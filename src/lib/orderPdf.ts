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

const RED: [number, number, number] = [220, 38, 38];
const BRAND: [number, number, number] = [217, 122, 122];
const DARK: [number, number, number] = [55, 55, 55];

const ROMANS = ["II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function pembayaranLabel(i: number): string {
  return `Pembayaran ${ROMANS[i] ?? String(i + 2)}`;
}

type InfoIcon = "invoice" | "user" | "wallet" | "calendar" | "phone" | "shield";

function drawInfoIcon(doc: jsPDF, kind: InfoIcon, x: number, y: number) {
  doc.setFillColor(...BRAND);
  doc.roundedRect(x, y, 7, 7, 1.6, 1.6, "F");
  doc.setFillColor(255, 255, 255);
  switch (kind) {
    case "invoice":
      doc.roundedRect(x + 2, y + 1.4, 3, 4.2, 0.4, 0.4, "F");
      doc.setDrawColor(...BRAND);
      doc.setLineWidth(0.3);
      doc.line(x + 2.6, y + 2.9, x + 4.4, y + 2.9);
      doc.line(x + 2.6, y + 3.8, x + 4.4, y + 3.8);
      break;
    case "user":
      doc.circle(x + 3.5, y + 2.7, 1.15, "F");
      doc.roundedRect(x + 1.7, y + 4.1, 3.6, 2.4, 1.2, 1.2, "F");
      break;
    case "wallet":
      doc.roundedRect(x + 1.5, y + 2, 4, 3.2, 0.7, 0.7, "F");
      doc.setFillColor(...BRAND);
      doc.circle(x + 4.6, y + 3.6, 0.35, "F");
      break;
    case "calendar":
      doc.roundedRect(x + 1.4, y + 2.2, 4.2, 3.4, 0.5, 0.5, "F");
      doc.setFillColor(...BRAND);
      doc.rect(x + 1.4, y + 2.2, 4.2, 0.8, "F");
      doc.setFillColor(255, 255, 255);
      doc.rect(x + 2.2, y + 1.3, 0.5, 1.2, "F");
      doc.rect(x + 4, y + 1.3, 0.5, 1.2, "F");
      break;
    case "phone":
      doc.roundedRect(x + 2.2, y + 1.2, 2.6, 4.6, 0.7, 0.7, "F");
      doc.setFillColor(...BRAND);
      doc.circle(x + 3.5, y + 5.1, 0.28, "F");
      break;
    case "shield":
      doc.roundedRect(x + 1.8, y + 1.4, 3.4, 2.6, 0.4, 0.4, "F");
      doc.triangle(x + 1.8, y + 3.7, x + 5.2, y + 3.7, x + 3.5, y + 5.6, "F");
      break;
  }
}

const STATUS_PILL: Record<string, { bg: [number, number, number]; fg: [number, number, number] }> = {
  LUNAS: { bg: [220, 252, 231], fg: [22, 101, 52] },
  DONE_DP: { bg: [254, 243, 199], fg: [146, 64, 14] },
  NO_PAYMENT: { bg: [254, 226, 226], fg: [153, 27, 27] },
};

export function buildOrderPdf(order: OrderPdfDTO) {
  const doc = new jsPDF();
  const margin = 14;

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setFillColor(255, 253, 253);
  doc.rect(0, 0, pageW, pageH, "F");

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

  const CARD_TOP = 38.5;
  const CARD_H = 23;
  doc.setFillColor(253, 242, 242);
  doc.setDrawColor(247, 213, 213);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, CARD_TOP, pageW - 2 * margin, CARD_H, 3, 3, "FD");

  const xDiv = margin + (pageW - 2 * margin) * 0.52;
  doc.line(xDiv, CARD_TOP + 3, xDiv, CARD_TOP + CARD_H - 3);

  const leftColX = margin + 3;
  const rightColX = xDiv + 6;
  const leftValX = leftColX + 34;
  const rightValX = rightColX + 27;
  const rowY = (i: number) => CARD_TOP + 6 + i * 6.8;

  const drawRow = (i: number, colX: number, valX: number, kind: InfoIcon, label: string, value: string) => {
    const by = rowY(i);
    drawInfoIcon(doc, kind, colX, by - 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    doc.text(label, colX + 10, by);
    doc.text(`: ${value}`, valX, by);
  };

  drawRow(0, leftColX, leftValX, "invoice", "Invoice", order.invoiceNumber);
  drawRow(1, leftColX, leftValX, "user", "Pembeli", order.buyer.name);

  const statusY = rowY(2);
  drawInfoIcon(doc, "wallet", leftColX, statusY - 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text("Status Bayar", leftColX + 10, statusY);
  const stLabel = PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus;
  const pill = STATUS_PILL[order.paymentStatus] ?? { bg: [234, 234, 234] as [number, number, number], fg: [60, 60, 60] as [number, number, number] };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const stW = doc.getTextWidth(stLabel);
  doc.setFillColor(...pill.bg);
  doc.roundedRect(leftValX, statusY - 3.4, stW + 4, 5.2, 2.4, 2.4, "F");
  doc.setTextColor(...pill.fg);
  doc.text(stLabel, leftValX + 2, statusY);

  drawRow(0, rightColX, rightValX, "calendar", "Tanggal", dateLabel(order.soldAt));
  drawRow(1, rightColX, rightValX, "phone", "No HP", order.buyer.phone || "—");
  drawRow(2, rightColX, rightValX, "shield", "No Resi", order.trackingNumber || "--");

  autoTable(doc, {
    startY: CARD_TOP + CARD_H + 4,
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
    doc.setFillColor(255, 253, 253);
    doc.rect(0, 0, pageW, pageH, "F");
    bankY = 26;
  }

  const CARD2_TOP = bankY - 5.5;
  const CARD_H2 = 22.5;
  doc.setFillColor(253, 242, 242);
  doc.setDrawColor(247, 213, 213);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, CARD2_TOP, pageW - 2 * margin, CARD_H2, 3, 3, "FD");

  const cx = margin + 8.5;
  const cy = CARD2_TOP + CARD_H2 / 2 - 2;
  doc.setFillColor(217, 122, 122);
  doc.circle(cx, cy, 4.5, "F");
  doc.setFillColor(255, 255, 255);
  doc.triangle(cx - 3.75, cy - 1.05, cx, cy - 3.3, cx + 3.75, cy - 1.05, "F");
  doc.rect(cx - 2.55, cy - 0.45, 0.85, 2.55, "F");
  doc.rect(cx - 0.42, cy - 0.45, 0.85, 2.55, "F");
  doc.rect(cx + 1.72, cy - 0.45, 0.85, 2.55, "F");
  doc.rect(cx - 3.75, cy + 2.4, 7.5, 0.9, "F");

  const MAROON: [number, number, number] = [154, 61, 61];
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
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8.5);
  doc.text("Adera Nurul", textX + 57, bankY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...MAROON);
  doc.text("BANK JAGO", textX, bankY + 13.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.text("103600160006", textX + 27, bankY + 13.5);
  doc.setTextColor(0, 0, 0);
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