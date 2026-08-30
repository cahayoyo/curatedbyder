"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import img1 from "@/assets/img/baru1.webp";
import img2 from "@/assets/img/baru2.jpg";
import img3 from "@/assets/img/baru3.jpg";
import img4 from "@/assets/img/baru4.jpg";
import img5 from "@/assets/img/baru5.jpg";
import img6 from "@/assets/img/baru6.jpg";
import img7 from "@/assets/img/baru7.webp";

const slides = [
  { src: img1, alt: "Book 1" },
  { src: img2, alt: "Book 2" },
  { src: img3, alt: "Book 3" },
  { src: img4, alt: "Book 4" },
  { src: img5, alt: "Book 5" },
  { src: img6, alt: "Book 6" },
  { src: img7, alt: "Book 7" },
] as const;

const SWIPE_THRESHOLD = 50;

export function PhotoCarousel() {
  const [index, setIndex] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState<ReadonlySet<number>>(new Set());
  const [dragX, setDragX] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const count = slides.length;

  function slideWidth() {
    return containerRef.current?.clientWidth ?? 900;
  }

  function goTo(i: number) {
    setIndex(((i % count) + count) % count);
  }

  function prev() {
    goTo(index - 1);
  }
  function next() {
    goTo(index + 1);
  }

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 2000);
    return () => clearInterval(id);
  }, [count]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setDragStart(e.clientX);
    setDragX(0);
    setDragging(true);
    e.currentTarget.style.cursor = "grabbing";
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragStart === null) return;
    const delta = e.clientX - dragStart;
    // Add slight resistance beyond a slide width
    setDragX(Math.max(-slideWidth() * 0.5, Math.min(slideWidth() * 0.5, delta)));
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.style.cursor = "grab";
    if (dragStart === null) return;
    const delta = e.clientX - dragStart;
    setDragStart(null);
    setDragging(false);
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      // Advance and snap to a full slide: reset the drag offset so the
      // track ends exactly on a slide boundary (then animates there).
      setDragX(0);
      // Swipe right (drag content to the right, delta > 0) reveals the PREVIOUS photo.
      // Swipe left (delta < 0) reveals the NEXT photo.
      if (delta > 0) prev();
      else next();
    } else {
      setDragX(null);
    }
  }

  function onPointerLeave() {
    if (!dragging) return;
    setDragStart(null);
    setDragging(false);
    setDragX(null);
  }

  const w = slideWidth();
  const offset = -index * w + (dragX ?? 0);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-3xl border bg-[#FED6D6] shadow-md select-none cursor-grab"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#FED6D6]">
        {!loadedSlides.has(index) && (
          <div className="absolute inset-0 animate-shimmer" />
        )}
        <div
          className={`absolute inset-0 flex ${dragging ? "" : "transition-transform duration-500 ease-out"}`}
          style={{
            transform: `translateX(${offset}px)`,
            width: w * count,
          }}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className="relative h-full shrink-0"
              style={{ width: w }}
            >
              <Image
                src={s.src}
                alt={s.alt}
                fill
                sizes="100vw"
                className="object-contain"
                onLoad={() =>
                  setLoadedSlides((prev) => {
                    if (prev.has(i)) return prev;
                    const nextSet = new Set(prev);
                    nextSet.add(i);
                    return nextSet;
                  })
                }
                priority={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60"
        onClick={prev}
        aria-label="Previous photo"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60"
        onClick={next}
        aria-label="Next photo"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
        {slides.map((s, i) => (
          <button
            key={i}
            aria-label={`Photo ${i + 1}`}
            className={`h-2 w-2 rounded-full transition-all ${
              i === index ? "w-4 bg-white" : "bg-white/60 hover:bg-white/90"
            }`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}