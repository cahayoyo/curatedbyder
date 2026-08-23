import * as XLSX from "xlsx";
const wb = XLSX.readFile("src/assets/temp/order2026.xlsx");
console.log("sheets:", wb.SheetNames);
const ws = wb.Sheets["TOYS"] as XLSX.WorkSheet | undefined;
if (!ws) {
  console.log("sheet TOYS not found");
  process.exit(0);
}
const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, unknown>[];
console.log("TOYS rows:", rows.length);
if (rows.length > 0) {
  console.log("columns:", Object.keys(rows[0]));
  for (let i = 0; i < Math.min(30, rows.length); i++) console.log(JSON.stringify(rows[i]));
}