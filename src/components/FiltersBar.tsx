import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  listBaladiyas,
  listPropertyTypes,
  listTransactionTypes,
  listWilayas,
} from "@/lib/findmedz";
import { useLang } from "@/lib/i18n";
import { pickName, pickTypeLabel, transactionTypesForAdKind, type AdKind } from "@/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterState {
  wilayaId: number | null;
  baladiyaId: number | null;
  propertyTypeId: number | null;
  transactionTypeId: number | null;
  keyword: string;
}

export const EMPTY_FILTERS: FilterState = {
  wilayaId: null,
  baladiyaId: null,
  propertyTypeId: null,
  transactionTypeId: null,
  keyword: "",
};

const ALL = "__all__";

export function FiltersBar({
  adKind,
  value,
  onChange,
}: {
  adKind: AdKind;
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const { lang, t } = useLang();

  const wilayas = useQuery({ queryKey: ["wilayas"], queryFn: listWilayas });
  const baladiyas = useQuery({
    queryKey: ["baladiyas", value.wilayaId],
    queryFn: () => listBaladiyas(value.wilayaId as number),
    enabled: value.wilayaId != null,
  });
  const propertyTypes = useQuery({ queryKey: ["property-types"], queryFn: listPropertyTypes });
  const transactionTypes = useQuery({
    queryKey: ["transaction-types"],
    queryFn: listTransactionTypes,
  });

  const allowedTransactionKeys = transactionTypesForAdKind(adKind).map((x) => x.key as string);
  const visibleTransactions = (transactionTypes.data ?? []).filter((x) =>
    allowedTransactionKeys.includes(x.key),
  );

  const isDirty =
    value.wilayaId !== null ||
    value.baladiyaId !== null ||
    value.propertyTypeId !== null ||
    value.transactionTypeId !== null ||
    value.keyword !== "";

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
      <div className="flex items-center gap-2 pb-3">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <span className="font-display text-sm font-bold">{t("filters")}</span>
        {isDirty && (
          <Button
            variant="ghost"
            size="sm"
            className="ms-auto h-7 gap-1 text-xs"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            <X className="h-3.5 w-3.5" />
            {t("reset")}
          </Button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Select
          value={value.wilayaId ? String(value.wilayaId) : ALL}
          onValueChange={(v) =>
            onChange({
              ...value,
              wilayaId: v === ALL ? null : Number(v),
              baladiyaId: null,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("wilaya")} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value={ALL}>{t("wilaya")} — {t("all")}</SelectItem>
            {(wilayas.data ?? []).map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>
                {w.code} ·{" "}
                {pickName(
                  { nameAr: w.name_ar, nameFr: w.name_fr, nameEn: w.name_en ?? w.name_fr },
                  lang,
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.baladiyaId ? String(value.baladiyaId) : ALL}
          onValueChange={(v) => onChange({ ...value, baladiyaId: v === ALL ? null : Number(v) })}
          disabled={value.wilayaId == null}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("baladiya")} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value={ALL}>{t("baladiya")} — {t("all")}</SelectItem>
            {baladiyas.data?.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                {lang === "ar" ? "لا توجد بلديات لهذه الولاية" : "Aucune commune disponible"}
              </div>
            )}
            {(baladiyas.data ?? []).map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {pickName(
                  { nameAr: b.name_ar, nameFr: b.name_fr, nameEn: b.name_en ?? b.name_fr },
                  lang,
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.propertyTypeId ? String(value.propertyTypeId) : ALL}
          onValueChange={(v) => onChange({ ...value, propertyTypeId: v === ALL ? null : Number(v) })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("propertyType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("propertyType")} — {t("all")}</SelectItem>
            {(propertyTypes.data ?? []).map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {pickTypeLabel(
                  { labelAr: p.label_ar, labelFr: p.label_fr, labelEn: p.label_en ?? p.label_fr },
                  lang,
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.transactionTypeId ? String(value.transactionTypeId) : ALL}
          onValueChange={(v) =>
            onChange({ ...value, transactionTypeId: v === ALL ? null : Number(v) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("transactionType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("transactionType")} — {t("all")}</SelectItem>
            {visibleTransactions.map((x) => (
              <SelectItem key={x.id} value={String(x.id)}>
                {pickTypeLabel(
                  { labelAr: x.label_ar, labelFr: x.label_fr, labelEn: x.label_en ?? x.label_fr },
                  lang,
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
          <Input
            value={value.keyword}
            onChange={(e) => onChange({ ...value, keyword: e.target.value })}
            placeholder={t("search")}
            className="ltr:pl-9 rtl:pr-9"
          />
        </div>
      </div>
    </div>
  );
}