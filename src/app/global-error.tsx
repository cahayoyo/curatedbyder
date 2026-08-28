"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Terjadi kesalahan</h2>
        <p style={{ fontSize: 14, color: "#666" }}>Coba muat ulang halaman.</p>
        <button
          onClick={reset}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            background: "#d97a7a",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Coba lagi
        </button>
      </body>
    </html>
  );
}
