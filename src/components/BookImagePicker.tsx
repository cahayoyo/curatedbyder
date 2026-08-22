"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing-client";
import { toast } from "sonner";
import { ImageIcon, X } from "lucide-react";

export function BookImagePicker({
  image,
  alt,
  onChange,
}: {
  image: string;
  alt: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);

  const { startUpload, isUploading } = useUploadThing("bookImage", {
    onUploadProgress: (p) => setProgress(p),
    onClientUploadComplete: (res) => {
      const url = res[0]?.url ?? "";
      if (url) onChange(url);
      toast.success("Gambar berhasil diunggah");
    },
    onUploadError: (err) => {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah gambar");
    },
  });

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setProgress(0);
    startUpload(Array.from(files));
  }

  const uploadLabel = isUploading ? `Mengunggah ${progress}%` : image ? "Ubah Gambar" : "Pilih Gambar";
  const baseBtn =
    "cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-start gap-3">
        {image ? (
          <div className="relative h-44 w-36 overflow-hidden rounded-lg border border-input bg-black/5">
            <Image
              src={image}
              alt={alt}
              fill
              sizes="144px"
              className="object-cover object-center"
            />
          </div>
        ) : (
          <button
            type="button"
            disabled={isUploading}
            onClick={openPicker}
            className={`${baseBtn} flex h-44 w-36 items-center justify-center rounded-lg border-2 border-dashed border-[#D97A7A] bg-[#FED6D6]/30 text-sm font-medium text-[#D97A7A] hover:bg-[#D97A7A] hover:text-white`}
          >
            <span className="flex flex-col items-center gap-1.5">
              <ImageIcon className="h-10 w-10" />
              {isUploading ? `Mengunggah ${progress}%` : "Pilih Gambar"}
            </span>
          </button>
        )}

        <button
          type="button"
          disabled={isUploading}
          onClick={openPicker}
          className={`${baseBtn} flex h-10 items-center gap-1.5 rounded-lg border border-[#D97A7A] bg-[#FED6D6] px-4 text-sm font-semibold text-[#D97A7A] hover:bg-[#D97A7A] hover:text-white`}
        >
          {uploadLabel}
        </button>

        {image && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => onChange("")}
            className={`${baseBtn} flex h-10 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 hover:bg-red-500 hover:text-white`}
          >
            <X className="h-4 w-4" />
            Hapus Gambar
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">PNG / JPG / WEBP, maks 4MB</p>
    </div>
  );
}