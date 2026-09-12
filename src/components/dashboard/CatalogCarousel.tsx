"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, ImageIcon, Phone } from "lucide-react";
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

const lihatSemuaCls =
  "flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E58A8A] bg-white px-3 py-1.5 text-xs font-semibold text-[#D97A7A] transition-colors hover:bg-[#FBE6E6]";

const kindCls: Record<CatalogItem["kind"], string> = {
  BUKU: "border-[#F0CBCB] bg-[#FBE6E6] text-[#C96A6A]",
  MAINAN: "border-amber-300 bg-amber-100 text-amber-800",
};

const priceCls =
  "rounded-full bg-[#FBE6E6] px-3.5 py-1.5 text-[15px] font-bold text-[#B85C5C]";

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
  const [maxDot, setMaxDot] = useState(0);
  const pinned = useRef<number | null>(null);

  const visible = isDesktop ? items : items.filter((i) => i.kind === tab);

  const metrics = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const cards = (Array.from(el.children) as HTMLElement[]).filter(
      (c) => c.getAttribute("aria-hidden") !== "true"
    );
    if (cards.length === 0) return;
    let lastReachable = cards.length - 1;
    if (isDesktop) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      lastReachable = 0;
      cards.forEach((c, i) => {
        if (c.offsetLeft <= maxScroll + 1) lastReachable = i;
      });
    }
    setMaxDot(lastReachable);
    if (pinned.current !== null) return;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((c, i) => {
      const d = isDesktop
        ? Math.abs(c.offsetLeft - el.scrollLeft)
        : Math.abs(c.offsetLeft + c.offsetWidth / 2 - (el.scrollLeft + el.clientWidth / 2));
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActiveIdx(best);
  }, [isDesktop]);

  useEffect(() => {
    const id = requestAnimationFrame(metrics);
    return () => cancelAnimationFrame(id);
  }, [metrics]);

  useEffect(() => {
    window.addEventListener("resize", metrics);
    return () => window.removeEventListener("resize", metrics);
  }, [metrics]);

  function selectTab(k: CatalogItem["kind"]) {
    setTab(k);
    pinned.current = null;
    setActiveIdx(0);
    trackRef.current?.scrollTo({ left: 0 });
    requestAnimationFrame(metrics);
  }

  function nudge(dir: -1 | 1) {
    if (visible.length === 0) return;
    const next = Math.min(maxDot, Math.max(0, activeIdx + dir));
    goToDot(next);
  }

  function goToDot(i: number) {
    const idx = Math.min(Math.max(0, i), maxDot);
    pinned.current = idx;
    setActiveIdx(idx);
    const card = trackRef.current?.children[idx] as HTMLElement | undefined;
    card?.scrollIntoView({
      behavior: "smooth",
      inline: isDesktop ? "start" : "center",
      block: "nearest",
    });
  }

  const drag = useRef<{ startX: number; startLeft: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    suppressClick.current = false;
    drag.current = { startX: e.clientX, startLeft: el.scrollLeft, moved: false };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = trackRef.current;
    if (!d || !el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 4) {
      d.moved = true;
      pinned.current = null;
      el.style.scrollSnapType = "none";
    }
    if (d.moved) el.scrollLeft = d.startLeft - dx;
  }

  function onPointerEnd() {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    suppressClick.current = true;
    const el = trackRef.current;
    if (!el) return;
    const cards = (Array.from(el.children) as HTMLElement[]).filter(
      (c) => c.getAttribute("aria-hidden") !== "true"
    );
    let nearest = cards[0];
    let bestDist = Infinity;
    cards.forEach((c) => {
      const dist = isDesktop
        ? Math.abs(c.offsetLeft - el.scrollLeft)
        : Math.abs(c.offsetLeft + c.offsetWidth / 2 - (el.scrollLeft + el.clientWidth / 2));
      if (dist < bestDist) {
        bestDist = dist;
        nearest = c;
      }
    });
    nearest?.scrollIntoView({
      behavior: "smooth",
      inline: isDesktop ? "start" : "center",
      block: "nearest",
    });
    window.setTimeout(() => {
      if (!drag.current && trackRef.current) trackRef.current.style.scrollSnapType = "";
    }, 450);
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function order(item: CatalogItem) {
    const kind = item.kind === "BUKU" ? "Buku" : "Mainan";
    const link = waLink(
      ADMIN_WA,
      `Halo Admin CuratedByDer, saya ${buyerName} ingin memesan *${item.title}* (${kind}) — ${formatIDR(item.price)}. Apakah stoknya tersedia?`
    );
    if (link) window.open(link, "_blank");
  }

  const dotCount = Math.min(maxDot, Math.max(0, visible.length - 1)) + 1;

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
              className={`${lihatSemuaCls} md:hidden`}
            >
              Lihat Semua
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="hidden items-center gap-3 md:flex">
              {arrows}
              <Link href="/dashboard/catalog" className={lihatSemuaCls}>
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
                onWheel={() => {
                  pinned.current = null;
                }}
                onTouchStart={() => {
                  pinned.current = null;
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerLeave={onPointerEnd}
                onClickCapture={onClickCapture}
                className={`relative mt-3 flex cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto pb-1 select-none active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                  isDesktop ? "pt-3" : "px-[21%] py-2"
                }`}
              >
                {visible.map((item, i) =>
                  isDesktop ? (
                    <div
                      key={`${item.kind}-${item.id}`}
                      className="relative flex w-[240px] shrink-0 snap-start flex-col rounded-2xl border border-[#F6D5D5] bg-gradient-to-br from-white to-[#FDF2F2] p-3 pt-4 shadow-sm"
                    >
                      <span
                        className={`absolute -top-2.5 left-3 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${kindCls[item.kind]}`}
                      >
                        {item.kind === "BUKU" ? "Buku" : "Mainan"}
                      </span>
                      <div className="flex items-start gap-3">
                        <div className="relative h-[104px] w-[76px] shrink-0 overflow-hidden rounded-lg bg-black/5 shadow-md">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="76px"
                              draggable={false}
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
                        <button
                          type="button"
                          onClick={() => order(item)}
                          aria-label={`Hubungi admin via WhatsApp tentang ${item.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-sm transition-colors hover:bg-[#1EBE5A]"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={`${item.kind}-${item.id}`}
                      className={`flex w-[58%] max-w-[200px] shrink-0 snap-center flex-col rounded-2xl border border-[#F6D5D5] bg-gradient-to-br from-white to-[#FDF2F2] p-2.5 transition-all duration-300 ${
                        i === activeIdx ? "scale-100 shadow-md" : "scale-[0.94] opacity-80"
                      }`}
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-black/5 shadow-md">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="200px"
                            draggable={false}
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
                        <button
                          type="button"
                          onClick={() => order(item)}
                          aria-label={`Hubungi admin via WhatsApp tentang ${item.title}`}
                          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-colors hover:bg-[#1EBE5A]"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-2 line-clamp-2 text-center text-[15px] font-bold leading-snug">
                        {item.title}
                      </p>
                      <div className="mt-2 flex justify-center">
                        <span className={priceCls}>{formatIDR(item.price)}</span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {dotCount > 1 && (
                <div className="mt-3 flex justify-center gap-2">
                  {Array.from({ length: dotCount }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Katalog ${i + 1}`}
                      onClick={() => goToDot(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === Math.min(activeIdx, dotCount - 1)
                          ? "w-4 bg-[#C96A6A]"
                          : "w-2 bg-[#C96A6A]/40 hover:bg-[#C96A6A]/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
