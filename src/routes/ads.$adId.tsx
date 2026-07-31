import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, MapPin, MessageSquare, Phone, Lock, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import { formatDzd, getAd, openConversation } from "@/lib/findmedz";
import { contactOptionsFor, pickName, pickTypeLabel, ROLE_LABELS } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/ads/$adId")({
  head: () => ({
    meta: [
      { title: "Annonce — FindMeDZ دبرلي" },
      {
        name: "description",
        content: "Détails de l'annonce immobilière : localisation, prix et contact du vendeur.",
      },
      { property: "og:title", content: "Annonce — FindMeDZ دبرلي" },
      { property: "og:description", content: "Détails de l'annonce immobilière sur FindMeDZ." },
    ],
  }),
  component: AdDetail,
});

function AdDetail() {
  const { adId } = Route.useParams();
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const ad = useQuery({ queryKey: ["ad", adId], queryFn: () => getAd(adId) });

  if (ad.isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-80 rounded-3xl" />
      </AppShell>
    );
  }
  if (!ad.data) {
    return (
      <AppShell>
        <p className="py-20 text-center text-muted-foreground">{t("noResults")}</p>
      </AppShell>
    );
  }

  const data = ad.data;
  const owner = data.owner;
  const contact = owner
    ? contactOptionsFor(owner.role, owner.account_tier)
    : { phone: false, whatsapp: false, message: true };
  const images = [...(data.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const price = formatDzd(data.price, t("dzd"));
  const advance = formatDzd(data.advance_payment, t("dzd"));

  async function startConversation() {
    if (!user) {
      toast.error(lang === "ar" ? "يجب تسجيل الدخول أولا" : "Connectez-vous d'abord");
      void navigate({ to: "/auth" });
      return;
    }
    if (!owner || owner.id === user.id) return;
    setBusy(true);
    try {
      const conversationId = await openConversation(data.id, user.id, owner.id);
      void navigate({ to: "/messages", search: { c: conversationId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl bg-muted shadow-card">
            {images.length ? (
              <img
                src={images[0].url}
                alt={pickTypeLabel(
                  {
                    labelAr: data.property_type?.label_ar ?? "",
                    labelFr: data.property_type?.label_fr ?? "",
                    labelEn: data.property_type?.label_en ?? "",
                  },
                  lang,
                )}
                className="aspect-[16/10] w-full object-cover"
              />
            ) : (
              <div className="grid aspect-[16/10] place-items-center bg-hero-gradient font-display text-4xl font-black text-primary-foreground/70">
                دبرلي
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={
                  data.ad_kind === "SUPPLY"
                    ? "bg-supply text-supply-foreground"
                    : "bg-demand text-demand-foreground"
                }
              >
                {data.ad_kind === "SUPPLY" ? t("supply") : t("demand")}
              </Badge>
              <Badge variant="secondary">
                {pickTypeLabel(
                  {
                    labelAr: data.transaction_type?.label_ar ?? "",
                    labelFr: data.transaction_type?.label_fr ?? "",
                    labelEn: data.transaction_type?.label_en ?? "",
                  },
                  lang,
                )}
              </Badge>
            </div>

            <h1 className="font-display text-2xl font-black">
              {pickTypeLabel(
                {
                  labelAr: data.property_type?.label_ar ?? "",
                  labelFr: data.property_type?.label_fr ?? "",
                  labelEn: data.property_type?.label_en ?? "",
                },
                lang,
              )}
            </h1>

            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {data.baladiya &&
                pickName(
                  {
                    nameAr: data.baladiya.name_ar,
                    nameFr: data.baladiya.name_fr,
                    nameEn: data.baladiya.name_en ?? data.baladiya.name_fr,
                  },
                  lang,
                )}
              ،{" "}
              {data.wilaya &&
                pickName(
                  {
                    nameAr: data.wilaya.name_ar,
                    nameFr: data.wilaya.name_fr,
                    nameEn: data.wilaya.name_en ?? data.wilaya.name_fr,
                  },
                  lang,
                )}
              {data.exact_address ? ` — ${data.exact_address}` : ""}
            </p>

            <div className="flex flex-wrap items-end gap-4">
              <span className="font-display text-3xl font-black text-primary">
                {price ?? t("negotiable")}
              </span>
              {advance && (
                <span className="text-sm text-muted-foreground">
                  {t("advance")}: {advance}
                </span>
              )}
            </div>

            {data.description && (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <h2 className="pb-2 font-display text-base font-bold">{t("description")}</h2>
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {data.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <Card className="h-fit shadow-card lg:sticky lg:top-24">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-hero-gradient font-display font-bold text-primary-foreground">
                {(owner?.full_name || "?").slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{owner?.full_name || "—"}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  {owner?.role === "AGENCY" && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                  {owner && ROLE_LABELS[owner.role][lang === "ar" ? "ar" : "fr"]}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {contact.phone && owner?.phone ? (
                <>
                  <Button asChild className="w-full">
                    <a href={`tel:${owner.phone}`}>
                      <Phone className="h-4 w-4" />
                      {t("call")} · {owner.phone}
                    </a>
                  </Button>
                  <Button asChild variant="secondary" className="w-full">
                    <a
                      href={`https://wa.me/213${owner.phone.replace(/^0/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t("whatsapp")}
                    </a>
                  </Button>
                </>
              ) : (
                <div className="flex items-start gap-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  {t("premiumOnly")}
                </div>
              )}

              <Button
                variant={contact.phone ? "outline" : "default"}
                className="w-full"
                disabled={busy || owner?.id === user?.id}
                onClick={() => void startConversation()}
              >
                <MessageSquare className="h-4 w-4" />
                {t("message")}
              </Button>

              <Button variant="ghost" className="w-full text-muted-foreground">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}