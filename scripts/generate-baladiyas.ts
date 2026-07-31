/**
 * Regenerates src/constants/locations/data/baladiyas.json from an official CSV.
 *
 * Usage:  bun scripts/generate-baladiyas.ts ./communes.csv
 *
 * Expected CSV header (order-independent):
 *   wilaya_code,commune_code,name_ar,name_fr,name_en
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(import.meta.dirname, "../src/constants/locations/data/baladiyas.json");

function parseCsv(text: string): Record<string, string>[] {
  const [headerLine, ...rows] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim());
  return rows.map((row) => {
    const cells = row.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? "").trim()]));
  });
}

const input = process.argv[2];
if (!input) {
  console.error("Usage: bun scripts/generate-baladiyas.ts <official-communes.csv>");
  process.exit(1);
}

const records = parseCsv(readFileSync(resolve(process.cwd(), input), "utf8")).map((r) => ({
  wilayaCode: r.wilaya_code.padStart(2, "0"),
  code: r.commune_code,
  nameAr: r.name_ar,
  nameFr: r.name_fr,
  nameEn: r.name_en || r.name_fr,
}));

records.sort((a, b) => a.code.localeCompare(b.code));
writeFileSync(OUT, `${JSON.stringify(records, null, 2)}\n`);
console.log(`Wrote ${records.length} baladiyas to ${OUT}`);