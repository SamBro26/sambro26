export const PAYMENT_METHODS = [
  "CHARGILY_EDAHABIA",
  "CHARGILY_CIB",
  "BARIDIMOB_MANUAL",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentMethodDef {
  key: PaymentMethod;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  automated: boolean;
  requiresReceipt: boolean;
}

export const PAYMENT_METHOD_DEFS: PaymentMethodDef[] = [
  { key: "CHARGILY_EDAHABIA", labelAr: "الذهبية (Chargily)", labelFr: "Edahabia (Chargily)", labelEn: "Edahabia (Chargily)", automated: true, requiresReceipt: false },
  { key: "CHARGILY_CIB", labelAr: "بطاقة CIB (Chargily)", labelFr: "Carte CIB (Chargily)", labelEn: "CIB card (Chargily)", automated: true, requiresReceipt: false },
  { key: "BARIDIMOB_MANUAL", labelAr: "بريدي موب (تحويل يدوي)", labelFr: "BaridiMob (virement manuel)", labelEn: "BaridiMob (manual transfer)", automated: false, requiresReceipt: true },
];

export const PAYMENT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];