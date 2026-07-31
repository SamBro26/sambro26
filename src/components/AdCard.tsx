import { Link } from "@tanstack/react-router";
import { Eye, MapPin, Sparkles } from "lucide-react";
import type { AdRow } from "@/lib/findmedz";
import { formatDzd } from "@/lib/findmedz";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { pickName, pickTypeLabel } from "@/constants";

function label(
  row: { label_ar: string; label_fr: string; label_en: string | null } | null,
  lang: "ar" | "fr" | "en",
) {
  if (!row) return "";
  return pickTypeLabel(
    { labelAr: row.label_ar, labelFr: row.label_fr, labelEn: row.label_en ?? row.label_fr },
    lang,
  );
}

function name(
  row: { name_ar: string; name_fr: string; name_en: string | null } | null,
  lang: "ar" | "fr" | "en",
) {
  if (!row) return "";
  return pickName(
    { nameAr: row.name_ar, nameFr: row.name_fr, nameEn: row.name_en ?? row.name_fr },
    lang,
  );
}

export function AdCard({ ad }: { ad: AdRow }) {
  const { lang, t } = useLang();
  const cover = [...(ad.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
  const price = formatDzd(ad.price, t("dzd"));

  return (
    <Link
      to="/ads/$adId"
      params={{ adId: ad.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover.url}
            alt={label(ad.property_type, lang)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-hero-gradient font-display text-3xl font-black text-primary-foreground/70">
            دبرلي
          </div>
        )}
        <div className="absolute top-2 flex gap-1.5 ltr:left-2 rtl:right-2">
          <Badge
            className={
              ad.ad_kind === "SUPPLY"
                ? "bg-supply text-supply-foreground"
                : "bg-demand text-demand-foreground"
            }
          >
            {ad.ad_kind === "SUPPLY" ? t("supply") : t("demand")}
          </Badge>
          {ad.is_featured && (
            <Badge className="gap-1 bg-premium-gradient text-premium-foreground">
              <Sparkles className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate font-display text-base font-bold">
            {label(ad.property_type, lang)} · {label(ad.transaction_type, lang)}
          </h3>
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {name(ad.baladiya, lang)}، {name(ad.wilaya, lang)}
          </span>
        </p>
        {ad.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{ad.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-lg font-extrabold text-primary">
            {price ?? t("negotiable")}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            {ad.views_count}
          </span>
        </div>
      </div>
    </Link>
  );
}