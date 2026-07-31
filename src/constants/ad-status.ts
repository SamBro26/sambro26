export const AD_KINDS = ["SUPPLY", "DEMAND"] as const;
export type AdKind = (typeof AD_KINDS)[number];

/** Tab labels used by the Home screen. */
export const AD_KIND_LABELS: Record<AdKind, { ar: string; fr: string; en: string }> = {
  SUPPLY: { ar: "العرض", fr: "Offres", en: "Supply" },
  DEMAND: { ar: "الطلب", fr: "Demandes", en: "Demand" },
};

export const AD_STATUSES = [
  "PENDING_REVIEW",
  "ACTIVE",
  "REJECTED",
  "EXPIRED",
  "SOLD_RENTED",
] as const;
export type AdStatus = (typeof AD_STATUSES)[number];

export const AD_STATUS_LABELS: Record<AdStatus, { ar: string; fr: string; en: string }> = {
  PENDING_REVIEW: { ar: "قيد المراجعة", fr: "En révision", en: "Pending review" },
  ACTIVE: { ar: "نشط", fr: "Actif", en: "Active" },
  REJECTED: { ar: "مرفوض", fr: "Rejeté", en: "Rejected" },
  EXPIRED: { ar: "منتهي", fr: "Expiré", en: "Expired" },
  SOLD_RENTED: { ar: "تم البيع/الكراء", fr: "Vendu / Loué", en: "Sold / Rented" },
};

export const REACTION_TYPES = ["LIKE", "LOVE"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];