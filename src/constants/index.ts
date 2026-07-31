export * from "./property-types";
export * from "./transaction-types";
export * from "./ad-status";
export * from "./account-tier";
export * from "./payment-methods";
export * from "./locations/wilayas";
export * from "./locations/baladiyas";

export type Lang = "ar" | "fr" | "en";

/** Pick a localized label from any of the `{ ar, fr, en }` label maps. */
export function pickLabel(labels: { ar: string; fr: string; en: string }, lang: Lang) {
  return labels[lang];
}

/** Pick a localized label from the `labelAr / labelFr / labelEn` shape. */
export function pickTypeLabel(
  def: { labelAr: string; labelFr: string; labelEn: string },
  lang: Lang,
) {
  return lang === "ar" ? def.labelAr : lang === "fr" ? def.labelFr : def.labelEn;
}

/** Pick a localized name from the `nameAr / nameFr / nameEn` shape. */
export function pickName(def: { nameAr: string; nameFr: string; nameEn: string }, lang: Lang) {
  return lang === "ar" ? def.nameAr : lang === "fr" ? def.nameFr : def.nameEn;
}