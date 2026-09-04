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
const VISIBLE = 3;
const POSITIONS = slides.length - VISIBLE + 1;

export function PhotoCarousel() {
  const [index, setIndex] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState<ReadonlySet<number>>(new Set());
  const [dragX, setDragX] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [slideW, setSlideW] = useState(0);
  const count = slides.length;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSlideW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function goTo(i: number) {
    setIndex(((i % POSITIONS) + POSITIONS) % POSITIONS);
  }

  function prev() {
    goTo(index - 1);
  }
  function next() {
    goTo(index + 1);
  }

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % POSITIONS), 2000);
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
    // Add slight resistance beyond half a visible window
    const half = ((slideW || 900) / VISIBLE) * 0.5;
    setDragX(Math.max(-half, Math.min(half, delta)));
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

  const w = slideW || 900;
  const offset = -index * (w / VISIBLE) + (dragX ?? 0);

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full select-none cursor-grab"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
      <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9]">
        {!loadedSlides.has(index) && (
          <div className="absolute inset-0 animate-shimmer" />
        )}
        <div
          className={`absolute inset-0 flex ${dragging ? "" : "transition-transform duration-500 ease-out"}`}
          style={{
            transform: `translateX(${offset}px)`,
          }}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className="relative h-full shrink-0"
              style={{ width: w / VISIBLE }}
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
        className="absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-[#F6CFCF] text-[#C96A6A] hover:bg-[#F0C4C4] hover:text-[#C96A6A]"
        onClick={prev}
        aria-label="Previous photo"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-[#F6CFCF] text-[#C96A6A] hover:bg-[#F0C4C4] hover:text-[#C96A6A]"
        onClick={next}
        aria-label="Next photo"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: POSITIONS }, (_, i) => (
          <button
            key={i}
            aria-label={`Photo ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-4 bg-[#C96A6A]" : "bg-[#F0C4C4] hover:bg-[#E8B4B4]"
            }`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </>
  );
}