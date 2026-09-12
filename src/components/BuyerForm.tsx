"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { capture } from "@/lib/posthog";
import { createBuyer, updateBuyer } from "@/server/actions/buyers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSuccessModal } from "@/components/SuccessModal";
import { AtSign, Check, MapPin, Phone, Plus, Trash2, User, UserPlus, X } from "lucide-react";
import { generateUsername } from "@/lib/username";
import { MAX_CONTACT, MAX_NAME, MAX_PHONE } from "@/lib/limits";

type InitialBuyer = {
  id?: string;
  name: string;
  phone: string;
  contact: string | null;
};

type BuyerRow = {
  id?: string;
  name: string;
  phone: string;
  contact: string;
};

function RequiredMark() {
  return <span className="text-[#D97A7A]">*</span>;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FDE7E7] text-[#C96A6A]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="text-[17px] font-semibold leading-tight">{title}</h3>
        <p className="text-[15px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

const fieldIconCls =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground";
const fieldIconTopCls =
  "pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground";

export function BuyerForm({ initial }: { initial?: InitialBuyer }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { success, error } = useSuccessModal();
  const [rows, setRows] = useState<BuyerRow[]>(() =>
    initial
      ? [
          {
            id: initial.id,
            name: initial.name,
            phone: initial.phone,
            contact: initial.contact ?? "",
          },
        ]
      : [{ name: "", phone: "", contact: "" }]
  );

  function upRow(index: number, key: keyof BuyerRow, value: string) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, { name: "", phone: "", contact: "" }]);
  }

  function removeRow(index: number) {
    setRows((rs) => rs.filter((_, i) => i !== index));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payloadOf = (r: BuyerRow) => ({
          name: r.name,
          phone: r.phone,
          contact: r.contact || null,
        });
        if (initial?.id) {
          const r = rows[0];
          const res = await updateBuyer(initial.id, payloadOf(r));
          if (!res.ok) {
            error(res.error);
            return;
          }
          success(`${r.name.trim()} berhasil diubah!`);
          capture("buyer_updated");
        } else {
          for (const r of rows) {
            const res = await createBuyer(payloadOf(r));
            if (!res.ok) {
              error(res.error);
              return;
            }
          }
          success(
            rows.length === 1
              ? `${rows[0].name.trim()} berhasil dibuat!`
              : `${rows.length} pembeli berhasil dibuat!`,
          );
          capture("buyer_created", { buyer_count: rows.length });
        }
        router.push("/admin/buyers");
        router.refresh();
      } catch (err) {
        error(err instanceof Error ? err.message : "Gagal menyimpan pembeli");
      }
    });
  }

  const cardCls = "rounded-xl border bg-white p-4 shadow-sm";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 [&_input]:text-base [&_label]:text-base [&_textarea]:text-base"
    >
      {rows.map((r, i) => (
        <div key={r.id ?? i} className="space-y-4">
          {rows.length > 1 && (
            <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-2 shadow-sm">
              <span className="text-base font-semibold">Pembeli {i + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRow(i)}
                className="border border-input text-destructive transition-colors hover:bg-red-500 hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          )}

          <section className={cardCls}>
            <SectionHeader
              icon={UserPlus}
              title="Informasi Pembeli"
              subtitle="Lengkapi data pembeli dengan benar."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  Nama Lengkap <RequiredMark />
                </Label>
                <div className="relative">
                  <User className={fieldIconCls} />
                  <Input
                    value={r.name}
                    onChange={(e) => upRow(i, "name", e.target.value)}
                    required
                    maxLength={MAX_NAME}
                    placeholder="Masukkan nama lengkap..."
                    className="pl-9 placeholder:text-[#b5b5b5]"
                  />
                </div>
              </div>

              <div className="order-3 space-y-1.5 sm:order-none">
                <Label>Username</Label>
                <div className="relative">
                  <AtSign className={fieldIconCls} />
                  <Input
                    value={
                      r.name.trim() && r.phone ? generateUsername(r.name, r.phone) : ""
                    }
                    disabled
                    placeholder="Terisi otomatis..."
                    className="pl-9 font-mono text-muted-foreground disabled:bg-black/5 disabled:text-muted-foreground disabled:opacity-100 placeholder:text-[#b5b5b5]"
                  />
                </div>
                <p className="text-[13px] text-muted-foreground">
                  Terbentuk otomatis dari nama depan dan 4 digit terakhir nomor telepon, lalu
                  digunakan untuk login.
                </p>
              </div>

              <div className="order-2 space-y-1.5 sm:order-none">
                <Label>
                  Nomor Telepon <RequiredMark />
                </Label>
                <div className="relative">
                  <Phone className={fieldIconCls} />
                  <Input
                    value={r.phone}
                    inputMode="numeric"
                    maxLength={MAX_PHONE}
                    onChange={(e) => upRow(i, "phone", e.target.value.replace(/\D/g, ""))}
                    required
                    placeholder="Masukkan nomor telepon..."
                    className="pl-9 placeholder:text-[#b5b5b5]"
                  />
                </div>
              </div>

              <div className="order-4 space-y-1.5 sm:order-none">
                <Label>Alamat</Label>
                <div className="relative">
                  <MapPin className={fieldIconTopCls} />
                  <Textarea
                    value={r.contact}
                    onChange={(e) => upRow(i, "contact", e.target.value)}
                    maxLength={MAX_CONTACT}
                    placeholder="Opsional..."
                    rows={2}
                    className="pl-9 placeholder:text-[#b5b5b5]"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      ))}

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-white/95 p-3 shadow-sm backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1 border border-[#F0CBCB] bg-white text-[15px] text-black transition-colors hover:bg-[#FDF1F1]"
        >
          <X className="h-4 w-4" />
          Batal
        </Button>
        {!initial?.id && (
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            className="flex-1 border border-transparent bg-[#FBE3E3] text-[15px] text-[#C96A6A] transition-colors hover:bg-[#F6D5D5] hover:text-[#C96A6A]"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        )}
        <Button
          type="submit"
          disabled={pending}
          className="flex-1 bg-[#D97A7A] text-[15px] text-white transition-colors hover:bg-[#c96666]"
        >
          <Check className="h-4 w-4" />
          {pending ? "Menyimpan..." : initial?.id ? "Ubah Pembeli" : "Buat Pembeli"}
        </Button>
      </div>
    </form>
  );
}
