import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  IdCard,
  MapPin,
  Phone,
  Quote,
  Truck,
} from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { dateLabel } from "@/lib/format";
import { avatarClass, initials } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { EditAddressButton } from "@/components/dashboard/EditAddressButton";

const cardCls = "rounded-2xl border border-[#F0CBCB] bg-white p-5 shadow-sm";

function SectionTitle({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FDE7E7] text-[#C96A6A]">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-[17px] font-bold leading-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold text-black">{value}</span>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await requireRole("USER");
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, username: true, phone: true, contact: true, createdAt: true },
  });
  if (!user) notFound();

  return (
    <div className="space-y-4 px-2 md:px-6">
      <nav className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
        <Link href="/dashboard/profile" className="text-[#C96A6A] hover:underline">
          Profil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-black">Informasi Profil</span>
      </nav>

      <div className={cn(cardCls, "flex items-center justify-between gap-4")}>
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard"
            aria-label="Kembali"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F0CBCB] bg-white text-[#C96A6A] transition-colors hover:bg-[#FED6D6] md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Profil Saya</h1>
            <p className="text-sm text-muted-foreground">
              Kelola informasi pribadi, alamat, dan preferensi akun kamu.
            </p>
          </div>
        </div>
        <Image
          src="/illustrations/reading.svg"
          alt=""
          width={130}
          height={120}
          unoptimized
          priority
          className="hidden shrink-0 lg:block"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cardCls}>
          <div className="flex items-start gap-4">
            <span
              className={cn(
                "flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-[26px] font-bold",
                avatarClass(user.name),
              )}
            >
              {initials(user.name)}
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-lg font-bold uppercase tracking-wide">{user.name}</p>
              <div className="mt-2 space-y-1.5 text-sm text-black/70">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-[#C96A6A]" />
                  {user.phone || "-"}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-[#C96A6A]" />
                  Bergabung sejak {dateLabel(user.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(cardCls, "hidden bg-[#FDF7F3] lg:flex lg:flex-col lg:justify-center")}>
          <Quote className="h-8 w-8 fill-[#F5C9C9] text-[#F5C9C9]" />
          <p className="mt-2 text-base italic leading-relaxed text-black/80">
            &ldquo;Buku adalah jendela kecil untuk melihat dunia yang lebih besar.&rdquo;
          </p>
          <span className="mt-3 block h-1 w-10 rounded-full bg-[#E58A8A]" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cardCls}>
          <SectionTitle icon={IdCard} title="Informasi Pribadi" />
          <div className="mt-2 divide-y divide-[#F6D5D5]">
            <InfoRow label="Nama Lengkap" value={user.name} />
            <InfoRow label="Username" value={user.username || "-"} />
            <InfoRow label="Nomor WhatsApp" value={user.phone || "-"} />
          </div>
        </section>

        <div className="space-y-4">
          <section className={cardCls}>
            <SectionTitle
              icon={MapPin}
              title="Alamat Utama"
              action={<EditAddressButton contact={user.contact} />}
            />
            <div className="mt-3 flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C96A6A]" />
              <p className="whitespace-pre-line text-sm text-black/80">
                {user.contact?.trim() ? user.contact : "-"}
              </p>
              {user.contact?.trim() ? (
                <span className="ml-auto shrink-0 rounded-md bg-[#FBE6E6] px-2 py-0.5 text-xs font-semibold text-[#C96A6A]">
                  Utama
                </span>
              ) : null}
            </div>
          </section>

          <section className={cardCls}>
            <SectionTitle icon={Truck} title="Metode Pengiriman Pilihan" />
            <div className="mt-4 flex items-center gap-3.5">
              <Truck className="h-9 w-9 shrink-0 text-black" strokeWidth={1.6} />
              <p className="text-sm font-semibold text-black">Kurir Pilihan CuratedByDer</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
