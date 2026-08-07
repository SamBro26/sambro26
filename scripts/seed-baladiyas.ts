/**
 * Bulk-loads every commune in src/constants/locations/data/baladiyas.json into
 * public.baladiyas. Idempotent: upserts on (wilaya_id, code).
 *
 * Usage:  bun scripts/seed-baladiyas.ts
 */
import { createClient } from "@supabase/supabase-js";
import { BALADIYAS_BY_WILAYA } from "../src/constants/locations/baladiyas";

const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
  auth: { persistSession: false },
});

const { data: wilayas, error: wErr } = await sb.from("wilayas").select("id,code");
if (wErr) throw wErr;
const idOf = Object.fromEntries((wilayas ?? []).map((w) => [w.code, w.id]));

const rows = Object.entries(BALADIYAS_BY_WILAYA).flatMap(([wilayaCode, list]) =>
  list.map((b) => ({
    wilaya_id: idOf[wilayaCode],
    code: b.code,
    name_ar: b.nameAr,
    name_fr: b.nameFr,
    name_en: b.nameEn,
  })),
);

for (let i = 0; i < rows.length; i += 500) {
  const { error } = await sb
    .from("baladiyas")
    .upsert(rows.slice(i, i + 500), { onConflict: "wilaya_id,code" });
  if (error) throw error;
}
console.log(`Seeded ${rows.length} baladiyas`);
