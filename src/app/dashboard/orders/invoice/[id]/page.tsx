import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  Download,
  ImageIcon,
  Info,
  ListOrdered,
  MapPin,
  Phone,
  ReceiptText,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";
import { requireRole } from "@/lib/session";
import { withBuyer } from "@/lib/rls";
import { buyerOrderInclude, toBuyerOrderDTO } from "@/lib/orderDto";
import { BuyerShell } from "@/components/BuyerShell";
import { CopyResi } from "@/components/BuyerTabs";
import { FORMAT_BADGE, PAYMENT_BADGE, PAYMENT_LABEL } from "@/lib/orderOptions";
import { dateShortLabel, formatIDR, timeShortLabel } from "@/lib/format";

function Cover({ image, alt, className }: { image: string | null; alt: string; className: string }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border border-[#F0CBCB] bg-white/70 ${className}`}
    >
      {image ? (
        <Image src={image} alt={alt} fill sizes="64px" className="object-cover object-center" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <ImageIcon className="h-4 w-4 text-black/30" />
        </div>
      )}
    </div>
  );
}

function KindTag({ kind }: { kind?: string }) {
  if (kind === "BUKU")
    return (
      <span className="inline-flex items-center rounded-full border border-sky-300 bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">
        Buku
      </span>
    );
  if (kind === "MAINAN")
    return (
      <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
        Mainan
      </span>
    );
  return null;
}

function FormatTags({ kind, formats }: { kind?: string; formats: string[] }) {
  return (
    <p className="flex flex-wrap items-center gap-1">
      <KindTag kind={kind} />
      {formats.map((f) => (
        <span
          key={f}
          className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${FORMAT_BADGE[f] ?? "border-gray-300 bg-gray-100 text-gray-700"}`}
        >
          {f}
        </span>
      ))}
    </p>
  );
}

function InfoLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {icon}
      <span className="line-clamp-1 min-w-0 flex-1 text-black/80">{children}</span>
    </div>
  );
}

function PayRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ShippingBlock({ contact, ongkir }: { contact: string | null; ongkir: number }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-black">
          <MapPin className="h-4 w-4 text-[#C96A6A]" />
          Alamat Pengiriman
        </p>
        <p className="mt-1 whitespace-pre-line pl-6 text-sm text-muted-foreground">
          {contact || "—"}
        </p>
      </div>
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-black">
          <Truck className="h-4 w-4 text-[#C96A6A]" />
          Metode Pengiriman
        </p>
        <p className="mt-1 pl-6 text-sm text-muted-foreground">Ongkir {formatIDR(ongkir)}</p>
      </div>
    </div>
  );
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("USER");

  const order = await withBuyer(session.user.id, (tx) =>
    tx.order.findFirst({
      where: { id, buyerId: session.user.id },
      include: buyerOrderInclude,
    })
  );
  if (!order) notFound();

  const dto = toBuyerOrderDTO(order);
  const cover = dto.items.find((it) => it.image)?.image ?? null;
  const subtotal = dto.items.reduce((n, it) => n + it.subtotal, 0);
  const ongkir = dto.shippingCost ?? 0;

  return (
    <BuyerShell>
      <div className="space-y-4 px-2 md:px-6">
        <p className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
          <Link href="/dashboard/orders" className="transition-colors hover:text-[#D97A7A]">
            Pesanan
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/dashboard/orders" className="transition-colors hover:text-[#D97A7A]">
            Invoice
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[#B04A4A]">{dto.invoiceNumber}</span>
        </p>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Link href="/dashboard/orders" aria-label="Kembali ke pesanan" className="md:hidden">
                <ArrowLeft className="h-5 w-5 text-[#B04A4A]" />
              </Link>
              <ReceiptText className="hidden h-6 w-6 text-[#D97A7A] md:block" />
              Invoice
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="md:hidden">Detail invoice pesanan kamu.</span>
              <span className="hidden md:inline">
                Detail invoice dan informasi pembayaran pesanan kamu.
              </span>
            </p>
          </div>
          <span
            className={`hidden shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold md:inline-flex ${PAYMENT_BADGE[dto.paymentStatus] ?? ""}`}
          >
            {PAYMENT_LABEL[dto.paymentStatus] || dto.paymentStatus}
          </span>
        </div>

        <div className="rounded-xl border border-[#F0CBCB]/60 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex min-w-0 items-start gap-3">
              <Cover
                image={cover}
                alt={dto.items[0]?.book.title ?? "Item pesanan"}
                className="w-[80px] self-stretch min-h-[110px]"
              />
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <CopyResi
                    value={dto.invoiceNumber}
                    label="Copy nomor invoice"
                    valueClassName="font-mono text-base font-bold break-all text-black md:text-lg"
                  />
                  <span
                    className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold md:hidden ${PAYMENT_BADGE[dto.paymentStatus] ?? ""}`}
                  >
                    {PAYMENT_LABEL[dto.paymentStatus] || dto.paymentStatus}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {dateShortLabel(dto.soldAt)} · {timeShortLabel(dto.soldAt)}
                </p>
                <InfoLine icon={<UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}>
                  {dto.buyerName}
                </InfoLine>
                <InfoLine icon={<Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}>
                  {dto.buyerPhone || "—"}
                </InfoLine>
                <InfoLine icon={<CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}>
                  {dateShortLabel(dto.soldAt)}
                </InfoLine>
              </div>
            </div>

            <div className="hidden md:block md:w-[45%]">
              <ShippingBlock contact={dto.buyerContact} ongkir={ongkir} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#F0CBCB]/60 bg-white p-4 shadow-sm md:hidden">
          <ShippingBlock contact={dto.buyerContact} ongkir={ongkir} />
        </div>

        <div className="rounded-xl border border-[#F0CBCB]/60 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <ListOrdered className="h-4 w-4 text-[#D97A7A]" />
            Daftar Produk
          </h3>

          <table className="mt-3 hidden w-full text-sm md:table">
            <thead>
              <tr className="bg-[#FBE6E6] text-left text-xs text-black/70">
                <th className="w-10 rounded-l-lg px-2 py-2 font-medium">#</th>
                <th className="px-2 py-2 font-medium">Produk</th>
                <th className="px-2 py-2 text-center font-medium">Format</th>
                <th className="px-2 py-2 text-center font-medium">Harga</th>
                <th className="px-2 py-2 text-center font-medium">Jumlah</th>
                <th className="rounded-r-lg px-2 py-2 text-left font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {dto.items.map((it, i) => (
                <tr key={i} className="border-b border-[#F0CBCB]/40 last:border-0">
                  <td className="px-2 py-3 align-middle text-muted-foreground">{i + 1}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <Cover image={it.image} alt={it.book.title} className="h-[48px] w-[34px]" />
                      <span className="font-medium">{it.book.title}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex justify-center">
                      <FormatTags kind={it.kind} formats={it.book.formats} />
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">{formatIDR(it.unitPrice)}</td>
                  <td className="px-2 py-3 text-center">{it.quantity}</td>
                  <td className="px-2 py-3 text-left font-semibold">{formatIDR(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 space-y-3 md:hidden">
            {dto.items.map((it, i) => (
              <div key={i}>
                <div className="flex items-center gap-3">
                  <Cover image={it.image} alt={it.book.title} className="h-[56px] w-[40px]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{it.book.title}</p>
                    <div className="mt-1">
                      <FormatTags kind={it.kind} formats={it.book.formats} />
                    </div>
                  </div>
                  <span className="shrink-0 font-semibold">{formatIDR(it.subtotal)}</span>
                </div>
                <p className="mt-1 text-left text-xs text-muted-foreground">
                  {formatIDR(it.unitPrice)} × {it.quantity}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#F0CBCB]/60 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Wallet className="h-4 w-4 text-[#D97A7A]" />
            Rincian Pembayaran
          </h3>
          <div className="mt-3 divide-y divide-[#F0CBCB]/60 text-sm">
            <PayRow label="Subtotal Produk" value={formatIDR(subtotal)} />
            <PayRow label="Ongkir" value={formatIDR(ongkir)} />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-[#FBE6E6] px-3 py-2.5">
            <span className="text-sm font-bold text-[#B04A4A]">Total Pembayaran</span>
            <span className="text-base font-bold text-[#B04A4A]">{formatIDR(dto.total)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-[#F0CBCB]/60 bg-[#FBE6E6]/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#C96A6A]" />
            <div>
              <p className="text-sm font-semibold text-[#B04A4A]">Informasi Pembayaran</p>
              <p className="mt-0.5 text-xs text-black/60">
                Silakan selesaikan pembayaran. Setelah pembayaran berhasil, pesanan akan segera
                diproses.
              </p>
            </div>
          </div>
          <a
            href={`/api/download/orders/${dto.id}?download=1`}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#D97A7A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#c9686b]"
          >
            <Download className="h-4 w-4" />
            Download Invoice PDF
          </a>
        </div>
      </div>
    </BuyerShell>
  );
}
