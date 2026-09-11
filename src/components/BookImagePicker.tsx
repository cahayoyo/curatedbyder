"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing-client";
import { useSuccessModal } from "@/components/SuccessModal";
import { ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function BookImagePicker({
  image,
  alt,
  onChange,
  endpoint = "bookImage",
  variant = "default",
}: {
  image: string;
  alt: string;
  onChange: (url: string) => void;
  endpoint?: "bookImage" | "paymentProof";
  variant?: "default" | "dropzone";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const { success, error } = useSuccessModal();

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onUploadProgress: (p) => setProgress(p),
    onClientUploadComplete: (res) => {
      const url = res[0]?.url ?? "";
      if (url) onChange(url);
      success("Gambar berhasil diunggah");
    },
    onUploadError: (err) => {
      error(err instanceof Error ? err.message : "Gagal mengunggah gambar");
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

  if (variant === "dropzone") {
    return (
      <div className="space-y-1.5">
        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "relative flex h-48 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[#E3B4B4] bg-[#FDF1F1] transition-colors hover:border-[#D97A7A]",
            isUploading && "cursor-wait opacity-80"
          )}
        >
          {image ? (
            <>
              <Image
                src={image}
                alt={alt}
                fill
                sizes="(max-width: 640px) 100vw, 480px"
                className="object-cover object-center"
              />
              {!isUploading && (
                <div className="absolute inset-0 flex items-end justify-center gap-2 bg-black/35 p-2 opacity-0 transition-opacity hover:opacity-100">
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-black">
                    Ubah
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange("");
                    }}
                    className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 px-4 text-center">
              <ImageIcon className="h-8 w-8 text-[#D97A7A]" />
              <p className="text-base font-medium text-[#C96A6A]">
                {isUploading ? `Mengunggah ${progress}%` : "Klik untuk upload gambar"}
              </p>
              <p className="text-[15px] text-muted-foreground">atau drag &amp; drop di sini</p>
            </div>
          )}
          {isUploading && image && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-base font-medium text-white">
              Mengunggah {progress}%
            </div>
          )}
        </div>
        <p className="text-[15px] text-muted-foreground">PNG, JPG, WEBP (maks. 4MB)</p>

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
    );
  }

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
