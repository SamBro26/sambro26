import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AdCard } from "@/components/AdCard";
import { EMPTY_FILTERS, FiltersBar, type FilterState } from "@/components/FiltersBar";
import { listAds } from "@/lib/findmedz";
import { useLang } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdKind } from "@/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FindMeDZ دبرلي — Annonces immobilières en Algérie" },
      {
        name: "description",
        content:
          "Parcourez les offres et demandes immobilières en Algérie : appartements, maisons, locaux et terrains, filtrés par wilaya et baladiya.",
      },
      { property: "og:title", content: "FindMeDZ دبرلي — Annonces immobilières en Algérie" },
      {
        property: "og:description",
        content: "Offres et demandes immobilières dans les 58 wilayas d'Algérie.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useLang();
  const [adKind, setAdKind] = useState<AdKind>("SUPPLY");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const ads = useQuery({
    queryKey: ["ads", adKind, filters],
    queryFn: () => listAds({ adKind, ...filters }),
  });

  return (
    <AppShell>
      <section className="mb-4 overflow-hidden rounded-3xl bg-hero-gradient px-5 py-7 text-primary-foreground shadow-float">
        <h1 className="font-display text-2xl leading-tight font-black sm:text-3xl">
          FindMeDZ <span className="opacity-80">دبرلي</span>
        </h1>
        <p className="mt-2 max-w-lg text-sm opacity-90">{t("tagline")}</p>
      </section>

      <Tabs value={adKind} onValueChange={(v) => setAdKind(v as AdKind)} className="mb-4">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1">
          <TabsTrigger
            value="SUPPLY"
            className="rounded-xl data-[state=active]:bg-supply data-[state=active]:text-supply-foreground"
          >
            {t("supply")}
          </TabsTrigger>
          <TabsTrigger
            value="DEMAND"
            className="rounded-xl data-[state=active]:bg-demand data-[state=active]:text-demand-foreground"
          >
            {t("demand")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <FiltersBar adKind={adKind} value={filters} onChange={setFilters} />

      <div className="mt-4">
        {ads.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : (ads.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
            {t("noResults")}
          </div>
        ) : (
          <>
            <p className="pb-3 text-sm text-muted-foreground">
              {ads.data?.length} {t("results")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ads.data?.map((ad) => <AdCard key={ad.id} ad={ad} />)}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
