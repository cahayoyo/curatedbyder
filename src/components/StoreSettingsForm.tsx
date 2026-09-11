"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Eye, EyeOff, Save, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSuccessModal } from "@/components/SuccessModal";
import {
  setBookDashboardVisibility,
  setToyDashboardVisibility,
  updateStoreSettings,
} from "@/server/actions/settings";
import type { StoreSettings } from "@/lib/store-settings";

const FIELDS: { key: keyof StoreSettings; label: string; hint: string }[] = [
  { key: "fixedCost", label: "Biaya Tetap (Rp)", hint: "Contoh: 22000" },
  { key: "serviceFee", label: "Biaya Layanan (Rp)", hint: "Contoh: 15000" },
  { key: "myrToIdr", label: "Kurs MYR ke IDR", hint: "Contoh: 4200" },
  { key: "shippingPerKg", label: "Ongkir per KG (Rp)", hint: "Contoh: 25000" },
];

export function StoreSettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const { success, error } = useSuccessModal();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Record<keyof StoreSettings, string>>({
    fixedCost: String(settings.fixedCost),
    serviceFee: String(settings.serviceFee),
    myrToIdr: String(settings.myrToIdr),
    shippingPerKg: String(settings.shippingPerKg),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    const parsed = {} as StoreSettings;
    for (const f of FIELDS) {
      const n = Number(draft[f.key]);
      if (!Number.isInteger(n) || n < (f.key === "myrToIdr" ? 1 : 0)) {
        error(`Nilai ${f.label} tidak valid.`);
        return;
      }
      parsed[f.key] = n;
    }

    startTransition(async () => {
      try {
        const res = await updateStoreSettings(parsed);
        if (!res.ok) {
          error(res.error);
          return;
        }
        success("Pengaturan berhasil disimpan!");
        router.refresh();
      } catch (err) {
        error(err instanceof Error ? err.message : "Gagal menyimpan pengaturan");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-[#F0CBCB] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FDE7E7] text-[#C96A6A]">
          <Calculator className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-[17px] font-semibold leading-tight">Kalkulator Bookxcess</h3>
          <p className="text-[15px] text-muted-foreground">
            Dipakai untuk estimasi di halaman login pembeli.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={`setting-${f.key}`} className="text-xs font-semibold text-gray-700">
              {f.label}
            </Label>
            <Input
              id={`setting-${f.key}`}
              inputMode="numeric"
              value={draft[f.key]}
              onChange={(e) =>
                setDraft((d) => ({ ...d, [f.key]: e.target.value.replace(/[^\d]/g, "") }))
              }
              placeholder={f.hint}
              className="rounded-lg border-rose-200 bg-white focus-visible:ring-[#E8B4B4]"
            />
          </div>
        ))}
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="mt-4 w-full bg-[#D97A7A] hover:bg-[#c9686b] sm:w-auto"
      >
        <Save />
        {pending ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </form>
  );
}

export type VisibilityItem = {
  id: string;
  title: string;
  showOnDashboard: boolean;
};

export function CatalogVisibilityList({
  kind,
  items,
}: {
  kind: "book" | "toy";
  items: VisibilityItem[];
}) {
  const { error } = useSuccessModal();
  const [rows, setRows] = useState(items);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(item: VisibilityItem) {
    const next = !item.showOnDashboard;
    setRows((rs) => rs.map((r) => (r.id === item.id ? { ...r, showOnDashboard: next } : r)));
    setPendingId(item.id);

    startTransition(async () => {
      try {
        const res =
          kind === "book"
            ? await setBookDashboardVisibility({ id: item.id, show: next })
            : await setToyDashboardVisibility({ id: item.id, show: next });
        if (!res.ok) {
          error(res.error);
          setRows((rs) =>
            rs.map((r) => (r.id === item.id ? { ...r, showOnDashboard: !next } : r))
          );
        }
      } catch (err) {
        error(err instanceof Error ? err.message : "Gagal mengubah visibilitas");
        setRows((rs) => rs.map((r) => (r.id === item.id ? { ...r, showOnDashboard: !next } : r)));
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <section className="rounded-xl border border-[#F0CBCB] bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FDE7E7] text-[#C96A6A]">
          <Store className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-[17px] font-semibold leading-tight">
            {kind === "book" ? "Katalog Buku" : "Katalog Mainan"}
          </h3>
          <p className="text-[15px] text-muted-foreground">
            Pilih produk yang tampil di katalog dashboard pembeli.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Belum ada produk.</p>
      ) : (
        <ul className="mt-2 divide-y divide-[#F6D5D5]">
          {rows.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <span
                  className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    item.showOnDashboard
                      ? "bg-[#FBE6E6] text-[#C96A6A]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {item.showOnDashboard ? "Tampil di dashboard" : "Tersembunyi"}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pendingId === item.id}
                onClick={() => toggle(item)}
                className="shrink-0 border-[#F0CBCB] text-[#B85C5C] hover:bg-[#FBE6E6] hover:text-[#B85C5C]"
              >
                {item.showOnDashboard ? <EyeOff /> : <Eye />}
                {item.showOnDashboard ? "Sembunyikan" : "Tampilkan"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
