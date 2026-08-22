"use client";

import Image from "next/image";
import { useState } from "react";

export function BookThumbnail({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-32 w-28 overflow-hidden rounded border border-input bg-black/5">
      {!loaded && <div className="animate-shimmer absolute inset-0" />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="112px"
        className="object-cover object-center"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}