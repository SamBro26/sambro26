import { pickName, pickTypeLabel, type AdKind, type Lang } from "@/constants";
import { useLang, type DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Labelled = { label_ar: string; label_fr: string; label_en: string | null } | null;
type Named = { name_ar: string; name_fr: string; name_en: string | null } | null;

export interface PlaceholderAd {
  ad_kind: AdKind;
  property_type: Labelled;
  transaction_type: (Labelled & { key: string | null }) | null;
  wilaya: Named;
  baladiya: Named;
}

const typeLabel = (row: Labelled, lang: Lang) =>
  row
    ? pickTypeLabel(
        { labelAr: row.label_ar, labelFr: row.label_fr, labelEn: row.label_en ?? row.label_fr },
        lang,
      )
    : "";

const placeName = (row: Named, lang: Lang) =>
  row
    ? pickName({ nameAr: row.name_ar, nameFr: row.name_fr, nameEn: row.name_en ?? row.name_fr }, lang)
    : "";

/**
 * Green placeholder shown when a listing has no photos:
 * a request reads "يبحث عن كراء شقة في السانية، وهران", an offer "شقة للبيع في السانية، وهران".
 */
export function placeholderText(
  ad: PlaceholderAd,
  lang: Lang,
  t: (key: DictKey) => string,
): string {
  const transaction = typeLabel(ad.transaction_type, lang);
  const property = typeLabel(ad.property_type, lang);
  const comma = lang === "ar" ? "، " : ", ";
  const place = [placeName(ad.baladiya, lang), placeName(ad.wilaya, lang)]
    .filter(Boolean)
    .join(comma);
  const where = place ? `${t("inPlace")} ${place}` : "";

  const forWord =
    ad.transaction_type?.key === "sale"
      ? t("forSale")
      : ad.transaction_type?.key === "rent"
        ? t("forRent")
        : ad.transaction_type?.key === "purchase"
          ? t("forPurchase")
          : "";

  const parts =
    ad.ad_kind === "DEMAND"
      ? [t("lookingFor"), transaction, property, where]
      : [property, forWord, where];

  return parts.filter(Boolean).join(" ");
}

export function AdPlaceholder({
  ad,
  className,
  textClassName,
}: {
  ad: PlaceholderAd;
  className?: string;
  textClassName?: string;
}) {
  const { lang, t } = useLang();
  const text = placeholderText(ad, lang, t);
  const autoSize =
    text.length > 58
      ? "text-xs sm:text-sm"
      : text.length > 40
        ? "text-sm sm:text-base"
        : "text-base sm:text-lg";

  return (
    <div
      className={cn(
        "grid place-items-center overflow-hidden bg-hero-gradient px-4 py-3 text-center",
        className,
      )}
    >
      <p
        className={cn(
          "line-clamp-3 font-display font-extrabold leading-snug text-primary-foreground",
          textClassName ?? autoSize,
        )}
      >
        {text}
      </p>
    </div>
  );
}
