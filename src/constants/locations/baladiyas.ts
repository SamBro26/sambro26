import raw from "./data/baladiyas.json";
import { WILAYAS, type WilayaDef } from "./wilayas";
import type { Lang } from "../index";

/**
 * Baladiya (commune) lookup.
 *
 * Data is stored as a dynamic key-value map: `{ [wilayaCode]: BaladiyaRecord[] }`,
 * so the file scales to the full 1541 Algerian communes without any code change —
 * only `data/baladiyas.json` grows. Wilaya codes are "01".."69".
 */
export interface BaladiyaRecord {
  code: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
}

export interface BaladiyaDef extends BaladiyaRecord {
  wilayaCode: string;
}

export type BaladiyaMap = Record<string, BaladiyaRecord[]>;

/** Mutable so extra datasets can be merged at runtime (see `registerBaladiyas`). */
const registry: BaladiyaMap = { ...(raw as BaladiyaMap) };

/** Normalize a wilaya id (1..69) or code ("2", "02") to the canonical 2-digit code. */
export function toWilayaCode(wilaya: string | number): string {
  return String(wilaya).padStart(2, "0");
}

/**
 * Merge a dynamic JSON payload into the lookup table.
 * Accepts either the keyed map shape or a flat array of `{ wilayaCode, ... }`.
 */
export function registerBaladiyas(input: BaladiyaMap | BaladiyaDef[]): void {
  const entries: BaladiyaDef[] = Array.isArray(input)
    ? input
    : Object.entries(input).flatMap(([wilayaCode, list]) =>
        list.map((b) => ({ ...b, wilayaCode })),
      );
  for (const b of entries) {
    const key = toWilayaCode(b.wilayaCode);
    const list = (registry[key] ||= []);
    if (!list.some((x) => x.code === b.code)) {
      list.push({ code: b.code, nameAr: b.nameAr, nameFr: b.nameFr, nameEn: b.nameEn });
    }
  }
}

export const BALADIYAS_BY_WILAYA: BaladiyaMap = registry;

/** Flat view, for search or bulk operations. */
export const allBaladiyas = (): BaladiyaDef[] =>
  Object.entries(registry).flatMap(([wilayaCode, list]) => list.map((b) => ({ ...b, wilayaCode })));

const wilayaByCode = new Map(WILAYAS.map((w) => [w.code, w]));

export const getWilayaByCode = (wilaya: string | number): WilayaDef | undefined =>
  wilayaByCode.get(toWilayaCode(wilaya));

/**
 * Synthetic chef-lieu entry used when a wilaya has no commune data yet.
 * Keeps every wilaya selectable so the ad wizard never dead-ends.
 */
export function chefLieuFallback(wilaya: string | number): BaladiyaRecord {
  const code = toWilayaCode(wilaya);
  const w = wilayaByCode.get(code);
  return {
    code: `${code}00`,
    nameAr: `مقر الولاية ${w?.nameAr ?? code}`,
    nameFr: `Chef-lieu ${w?.nameFr ?? code}`,
    nameEn: `Chef-lieu ${w?.nameEn ?? code}`,
  };
}

/** Communes of a wilaya; always returns at least the chef-lieu placeholder. */
export function baladiyasOfWilaya(wilaya: string | number): BaladiyaRecord[] {
  const list = registry[toWilayaCode(wilaya)];
  return list && list.length > 0 ? list : [chefLieuFallback(wilaya)];
}

/** Raw list without the placeholder fallback (empty when unseeded). */
export const knownBaladiyasOfWilaya = (wilaya: string | number): BaladiyaRecord[] =>
  registry[toWilayaCode(wilaya)] ?? [];

export function baladiyaLabel(b: BaladiyaRecord, lang: Lang): string {
  return lang === "ar" ? b.nameAr : lang === "fr" ? b.nameFr : b.nameEn;
}

let byCodeIndex: Map<string, BaladiyaDef> | null = null;

export const getBaladiya = (code: string): BaladiyaDef | undefined => {
  // Built lazily (and cached) so importing this module never walks 1500+ rows.
  byCodeIndex ??= new Map(allBaladiyas().map((b) => [b.code, b]));
  return byCodeIndex.get(code);
};

/** Legacy flat accessor kept for backwards compatibility. */
export const getAllBaladiyas = (): BaladiyaDef[] => allBaladiyas();
