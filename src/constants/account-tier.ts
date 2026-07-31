export const ACCOUNT_TIERS = ["FREE", "PREMIUM"] as const;
export type AccountTier = (typeof ACCOUNT_TIERS)[number];

export const USER_ROLES = ["INDIVIDUAL", "AGENCY", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface TierFeatures {
  maxActiveAds: number;
  canFeatureAds: boolean;
  showsPhoneNumber: boolean;
  prioritySupport: boolean;
  maxImagesPerAd: number;
}

export const TIER_FEATURES: Record<AccountTier, TierFeatures> = {
  FREE: {
    maxActiveAds: 3,
    canFeatureAds: false,
    showsPhoneNumber: false,
    prioritySupport: false,
    maxImagesPerAd: 4,
  },
  PREMIUM: {
    maxActiveAds: 100,
    canFeatureAds: true,
    showsPhoneNumber: true,
    prioritySupport: true,
    maxImagesPerAd: 15,
  },
};

export const TIER_LABELS: Record<AccountTier, { ar: string; fr: string; en: string }> = {
  FREE: { ar: "مجاني", fr: "Gratuit", en: "Free" },
  PREMIUM: { ar: "مميز", fr: "Premium", en: "Premium" },
};

export const ROLE_LABELS: Record<UserRole, { ar: string; fr: string; en: string }> = {
  INDIVIDUAL: { ar: "خاص", fr: "Particulier", en: "Individual" },
  AGENCY: { ar: "وكالة عقارية", fr: "Agence", en: "Agency" },
  ADMIN: { ar: "مشرف", fr: "Admin", en: "Admin" },
};

/**
 * Contact channels available on an ad, decided by the ad owner's role + tier.
 * Agencies always expose a phone number; individuals only when premium.
 */
export function contactOptionsFor(role: UserRole, tier: AccountTier) {
  const phone = role === "AGENCY" || TIER_FEATURES[tier].showsPhoneNumber;
  return { phone, whatsapp: phone, message: true };
}