"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, ImageIcon, ShoppingCart } from "lucide-react";
import { FormatBadge } from "@/components/FormatBadge";
import { formatIDR } from "@/lib/format";
import { ADMIN_WA, waLink } from "@/lib/wa";

export type CatalogItem = {
  id: string;
  title: string;
  image: string | null;
  price: number;
  kind: "BUKU" | "MAINAN";
  formats: string[];
};

const arrowCls =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F0CBCB] bg-white text-[#C96A6A] shadow-sm transition-colors hover:bg-[#FBE6E6]";

const kindCls: Record<CatalogItem["kind"], string> = {
  BUKU: "border-[#F0CBCB] bg-[#FBE6E6] text-[#C96A6A]",
  MAINAN: "border-amber-300 bg-amber-100 text-amber-800",
};

const priceCls =
  "rounded-full bg-[#FBE6E6] px-3 py-1 text-sm font-bold text-[#C96A6A]";

function subscribeDesktop(cb: () => void) {
  const mq = window.matchMedia("(min-width: 768px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function CatalogCarousel({
  items,
  buyerName,
}: {
  items: CatalogItem[];
  buyerName: string;
}) {
  const [tab, setTab] = useState<CatalogItem["kind"]>("BUKU");
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false
  );
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const visible = isDesktop ? items : items.filter((i) => i.kind === tab);

  function metrics() {
    const el = trackRef.current;
    if (!el) return;
    const count = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPageCount(count);
    setPage(Math.min(count - 1, Math.round(el.scrollLeft / el.clientWidth)));
    const mid = el.scrollLeft + el.clientWidth / 2;
    const cards = Array.from(el.children) as HTMLElement[];
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActiveIdx(best);
  }

  useEffect(() => {
    const id = requestAnimationFrame(metrics);
    return () => cancelAnimationFrame(id);
  }, [isDesktop]);

  useEffect(() => {
    window.addEventListener("resize", metrics);
    return () => window.removeEventListener("resize", metrics);
  }, []);

  function selectTab(k: CatalogItem["kind"]) {
    setTab(k);
    setActiveIdx(0);
    setPage(0);
    trackRef.current?.scrollTo({ left: 0 });
    requestAnimationFrame(metrics);
  }

  function nudge(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  }

  function goToPage(i: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  function goToDot(i: number) {
    if (isDesktop) {
      goToPage(i);
      return;
    }
    const card = trackRef.current?.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function order(item: CatalogItem) {
    const kind = item.kind === "BUKU" ? "Buku" : "Mainan";
    const link = waLink(
      ADMIN_WA,
      `Halo Admin CuratedByDer, saya ${buyerName} ingin memesan *${item.title}* (${kind}) — ${formatIDR(item.price)}. Apakah stoknya tersedia?`
    );
    if (link) window.open(link, "_blank");
  }

  const arrows = (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label="Katalog sebelumnya"
        className={arrowCls}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label="Katalog berikutnya"
        className={arrowCls}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-4 w-4 text-[#D97A7A]" />
          Katalog Buku &amp; Mainan
        </h4>
        {items.length > 0 && (
          <>
            <Link
              href="/dashboard/catalog"
              className="flex items-center gap-0.5 text-xs font-semibold text-[#D97A7A] hover:underline md:hidden"
            >
              Lihat Semua
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="hidden items-center gap-3 md:flex">
              {arrows}
              <Link
                href="/dashboard/catalog"
                className="flex items-center gap-0.5 text-xs font-semibold text-[#D97A7A] hover:underline"
              >
                Lihat Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Katalog segera hadir.</p>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between gap-3 md:hidden">
            <div className="flex gap-2">
              {(["BUKU", "MAINAN"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => selectTab(k)}
                  aria-pressed={tab === k}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    tab === k
                      ? "bg-[#D97A7A] text-white shadow-sm"
                      : "bg-white text-[#C96A6A] hover:bg-[#FBE6E6]"
                  }`}
                >
                  {k === "BUKU" ? "Buku" : "Mainan"}
                </button>
              ))}
            </div>
            {arrows}
          </div>

          {visible.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Belum ada koleksi.</p>
          ) : (
            <>
              <div
                ref={trackRef}
                onScroll={metrics}
                className={`relative mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                  isDesktop ? "" : "px-[21%] py-2"
                }`}
              >
                {visible.map((item, i) =>
                  isDesktop ? (
                    <button
                      key={`${item.kind}-${item.id}`}
                      type="button"
                      onClick={() => order(item)}
                      className="relative flex w-[240px] shrink-0 snap-start flex-col rounded-2xl border border-[#F6D5D5] bg-gradient-to-br from-white to-[#FDF2F2] p-3 pt-4 text-left shadow-sm transition-shadow hover:shadow-md"
                    >
                      <span
                        className={`absolute -top-2.5 left-3 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${kindCls[item.kind]}`}
                      >
                        {item.kind === "BUKU" ? "Buku" : "Mainan"}
                      </span>
                      <div className="flex items-start gap-3">
                        <div className="relative h-[104px] w-[76px] shrink-0 overflow-hidden rounded-lg border bg-black/5 shadow-sm">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="76px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-black/30" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="line-clamp-2 text-[15px] font-bold leading-snug">
                            {item.title}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            {item.formats.map((f) => (
                              <FormatBadge key={f} value={f} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[#FBE6E6] px-3.5 py-1.5 text-[15px] font-bold text-[#B85C5C]">
                          {formatIDR(item.price)}
                        </span>
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D97A7A] text-white shadow-sm"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </span>
                      </div>
                    </button>
                  ) : (
                    <button
                      key={`${item.kind}-${item.id}`}
                      type="button"
                      onClick={() => order(item)}
                      className={`flex w-[58%] max-w-[200px] shrink-0 snap-center flex-col rounded-xl border border-[#F0CBCB]/60 p-2 text-left transition-all duration-300 ${
                        i === activeIdx
                          ? "scale-100 bg-white shadow-md"
                          : "scale-[0.94] bg-white/80 opacity-80"
                      }`}
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-black/5">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="200px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-black/30" />
                          </span>
                        )}
                        <span
                          className={`absolute left-1.5 top-1.5 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${kindCls[item.kind]}`}
                        >
                          {item.kind === "BUKU" ? "Buku" : "Mainan"}
                        </span>
                        <span className="absolute right-1.5 top-1.5 flex gap-0.5">
                          {item.formats.map((f) => (
                            <FormatBadge key={f} value={f} />
                          ))}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-center text-sm font-semibold leading-snug">
                        {item.title}
                      </p>
                      <div className="mt-2 flex justify-center">
                        <span className={priceCls}>{formatIDR(item.price)}</span>
                      </div>
                    </button>
                  )
                )}
              </div>

              {(isDesktop ? pageCount : visible.length) > 1 && (
                <div className="mt-3 flex justify-center gap-2">
                  {Array.from(
                    { length: isDesktop ? pageCount : visible.length },
                    (_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Katalog ${i + 1}`}
                        onClick={() => goToDot(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === (isDesktop ? page : activeIdx)
                            ? "w-4 bg-[#C96A6A]"
                            : "w-2 bg-[#C96A6A]/40 hover:bg-[#C96A6A]/60"
                        }`}
                      />
                    )
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
