import raw from "./data/baladiyas.json";

/**
 * Loader over data/baladiyas.json.
 * The JSON ships with sample data (2 wilayas) — regenerate the full official
 * list with `scripts/generate-baladiyas.ts`.
 */
export interface BaladiyaDef {
  wilayaCode: string;
  code: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
}

export const BALADIYAS: BaladiyaDef[] = raw as BaladiyaDef[];

const byWilaya = BALADIYAS.reduce<Record<string, BaladiyaDef[]>>((acc, b) => {
  (acc[b.wilayaCode] ||= []).push(b);
  return acc;
}, {});

export const baladiyasOfWilaya = (wilayaCode: string): BaladiyaDef[] => byWilaya[wilayaCode] ?? [];

export const getBaladiya = (code: string) => BALADIYAS.find((b) => b.code === code);