import type { AdKind } from "./ad-status";

export const TRANSACTION_TYPE_KEYS = ["sale", "purchase", "rent"] as const;
export type TransactionTypeKey = (typeof TRANSACTION_TYPE_KEYS)[number];

export interface TransactionTypeDef {
  key: TransactionTypeKey;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  sortOrder: number;
  /** Which ad kinds this transaction is valid for. */
  validAdKinds: AdKind[];
}

export const TRANSACTION_TYPES: TransactionTypeDef[] = [
  { key: "sale", labelAr: "بيع", labelFr: "Vente", labelEn: "Sale", sortOrder: 1, validAdKinds: ["SUPPLY"] },
  { key: "purchase", labelAr: "شراء", labelFr: "Achat", labelEn: "Purchase", sortOrder: 2, validAdKinds: ["DEMAND"] },
  { key: "rent", labelAr: "كراء", labelFr: "Location", labelEn: "Rent", sortOrder: 3, validAdKinds: ["SUPPLY", "DEMAND"] },
];

export const transactionTypesForAdKind = (kind: AdKind) =>
  TRANSACTION_TYPES.filter((t) => t.validAdKinds.includes(kind));

export const getTransactionType = (key: string) => TRANSACTION_TYPES.find((t) => t.key === key);