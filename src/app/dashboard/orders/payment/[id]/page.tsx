import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Download,
  Info,
  MessageCircle,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { requireRole } from "@/lib/session";
import { withBuyer } from "@/lib/rls";
import { buyerOrderInclude, toBuyerOrderDTO } from "@/lib/orderDto";
import { BuyerShell } from "@/components/BuyerShell";
import { PAYMENT_BADGE, PAYMENT_LABEL } from "@/lib/orderOptions";
import { dateLabel, dateShortLabel, formatIDR, timeShortLabel } from "@/lib/format";
import { ADMIN_WA, waLink } from "@/lib/wa";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("USER");

  const order = await withBuyer(session.user.id, (tx) =>
    tx.order.findFirst({
      where: { id, buyerId: session.user.id },
      include: { ...buyerOrderInclude, payments: { orderBy: { paidAt: "asc" } } },
    })
  );
  if (!order) notFound();

  const dto = toBuyerOrderDTO(order);
  const payments = order.payments;

  const dp = dto.dp ?? 0;
  const paid = Math.max(0, dto.total - (dto.remaining ?? 0));
  const otherPaid = Math.max(0, paid - dp);
  const pct = dto.total > 0 ? Math.min(100, Math.round((paid / dto.total) * 100)) : 0;
  const totalQty = dto.items.reduce((n, it) => n + it.quantity, 0);
  const firstTitle = dto.items[0]?.book.title ?? "—";
  const extraItems = dto.items.length - 1;
  const waHref = waLink(
    ADMIN_WA,
    `Halo Admin CuratedByDer,\n\nSaya ${dto.buyerName} ingin menanyakan terkait pembayaran invoice ${dto.invoiceNumber}.\n\nTerimakasih`
  );

  return (
    <BuyerShell>
      <div className="space-y-4 px-2 md:px-6">
        <p className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
          <Link href="/dashboard/orders" className="transition-colors hover:text-[#D97A7A]">
            Pesanan
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            href="/dashboard/orders?tab=payment"
            className="transition-colors hover:text-[#D97A7A]"
          >
            Pembayaran
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[#B04A4A]">{dto.invoiceNumber}</span>
        </p>

        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Link
              href="/dashboard/orders?tab=payment"
              aria-label="Kembali ke pembayaran"
              className="md:hidden"
            >
              <ArrowLeft className="h-5 w-5 text-[#B04A4A]" />
            </Link>
            <Wallet className="hidden h-6 w-6 text-[#D97A7A] md:block" />
            Pembayaran
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Detail pembayaran dan riwayat transaksi pesanan kamu.
          </p>
        </div>

        <section className="rounded-2xl border border-[#F0CBCB]/60 bg-gradient-to-br from-[#FBE6E6] to-[#F6D5D5] p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-sm font-bold break-all text-black">
                {dto.invoiceNumber}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-black/60">
                <CalendarDays className="h-3.5 w-3.5" />
                {dateShortLabel(dto.soldAt)} · {timeShortLabel(dto.soldAt)}
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-black/60">
                {firstTitle}
                {extraItems > 0 ? ` +${extraItems}` : ""} · {totalQty} item
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${PAYMENT_BADGE[dto.paymentStatus] ?? ""}`}
            >
              {PAYMENT_LABEL[dto.paymentStatus] || dto.paymentStatus}
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-white/70 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-black/60">Sisa Tagihan</p>
                <p className="mt-0.5 text-2xl font-bold text-[#B04A4A]">
                  {formatIDR(dto.remaining ?? 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-black/60">Total Pesanan</p>
                <p className="mt-0.5 text-base font-bold">{formatIDR(dto.total)}</p>
              </div>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#F0CBCB]">
              <div
                className="h-full rounded-full bg-[#D97A7A]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-black/60">
              <span className="font-semibold text-[#B04A4A]">{formatIDR(paid)}</span> terbayar (
              {pct}%)
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-[#F0CBCB]/60 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Wallet className="h-4 w-4 text-[#D97A7A]" />
            Rincian Pembayaran
          </h3>
          <div className="mt-3 space-y-2.5 text-sm">
            <Row label="Total Pesanan" value={formatIDR(dto.total)} />
            <Row label="Uang Muka (DP)" value={formatIDR(dp)} />
            <Row label="Pembayaran Lainnya" value={formatIDR(otherPaid)} />
            <div className="h-px w-full bg-[#F0CBCB]" />
            <Row label="Total Dibayar" value={formatIDR(paid)} />
            <div className="flex items-center justify-between rounded-lg bg-[#FBE6E6] px-3 py-2.5">
              <span className="text-sm font-bold text-[#B04A4A]">Sisa Tagihan</span>
              <span className="text-base font-bold text-[#B04A4A]">
                {formatIDR(dto.remaining ?? 0)}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#F0CBCB]/60 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <ReceiptText className="h-4 w-4 text-[#D97A7A]" />
            Riwayat Pembayaran
          </h3>
          {payments.length === 0 ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#FBE6E6]/60 p-3 text-sm text-black/70">
              <Info className="h-4 w-4 shrink-0 text-[#C96A6A]" />
              Belum ada pembayaran tambahan yang tercatat.
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-[#F0CBCB]/60 bg-[#FDF7F3] p-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FBE6E6] text-[#B04A4A]">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{formatIDR(p.amount)}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {dateLabel(p.paidAt)}
                      {p.note ? ` · ${p.note}` : ""}
                    </p>
                  </div>
                  {p.proofUrl ? (
                    <a
                      href={p.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs font-semibold text-[#C96A6A] transition-colors hover:text-[#B04A4A]"
                    >
                      Lihat Bukti
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-3 rounded-xl border border-[#F0CBCB]/60 bg-[#FBE6E6]/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#C96A6A]" />
            <div>
              <p className="text-sm font-semibold text-[#B04A4A]">Butuh bantuan?</p>
              <p className="mt-0.5 text-xs text-black/60">
                Hubungi admin jika ada pertanyaan tentang pembayaran atau bukti transfer.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <a
              href={`/api/download/orders/${dto.id}?download=1`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#D97A7A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#c9686b]"
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </a>
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe57]"
              >
                <MessageCircle className="h-4 w-4" />
                Hubungi Admin
              </a>
            )}
          </div>
        </div>
      </div>
    </BuyerShell>
  );
}
