// Guardrail: cegah db:migrate / db:seed jalan terhadap DB production.
// Dipanggil otomatis oleh npm script sebelum prisma. Bypass: SKIP_DB_GUARD=1
import { readFileSync } from "node:fs";

const PROD_DB_MARKER = "ep-solitary-grass-azn1bn1a";

if (process.env.SKIP_DB_GUARD === "1") {
  console.log("GUARD: dilewati (SKIP_DB_GUARD=1)");
  process.exit(0);
}

let raw = "";
try {
  raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
} catch {
  console.error("GUARD: file .env tidak ditemukan");
  process.exit(1);
}

const line = raw.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
const url = line
  ?.split("=")
  .slice(1)
  .join("=")
  .trim()
  .replace(/^["']|["']$/g, "");

if (!url) {
  console.error("GUARD: DATABASE_URL kosong di .env");
  process.exit(1);
}

if (url.includes(PROD_DB_MARKER)) {
  console.error("GUARD: DATABASE_URL menunjuk ke DB PRODUCTION!");
  console.error("Ganti DATABASE_URL di .env ke DB dev (ep-royal-sunset), atau set SKIP_DB_GUARD=1 untuk memaksa.");
  process.exit(1);
}

console.log("GUARD: OK — bukan DB production");
