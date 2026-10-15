import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  MessageSquare,
  MessagesSquare,
  Phone,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import { formatDzd, getAd, openConversation, trackAdView } from "@/lib/findmedz";
import { pickName, pickTypeLabel, ROLE_LABELS } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ReportDialog } from "@/components/ReportDialog";
import { BlockGate, BlockUserButton } from "@/components/BlockUserButton";

export const Route = createFileRoute("/ads/$adId")({
  head: () => ({
    meta: [
      { title: "Annonce — سكنة وحانوت" },
      {
        name: "description",
        content: "Détails de l'annonce immobilière : localisation, prix et contact du vendeur.",
      },
      { property: "og:title", content: "Annonce — سكنة وحانوت" },
      { property: "og:description", content: "Détails de l'annonce immobilière sur سكنة وحانوت." },
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const ad = useQuery({ queryKey: ["ad", adId], queryFn: () => getAd(adId) });

  // Count a view once per ad per browser session (owner excluded server-side).
  useEffect(() => {
    if (!ad.data) return;
    if (user && ad.data.owner?.id === user.id) return;
    void trackAdView(adId);
  }, [adId, ad.data, user]);

  useEffect(() => {
    const el = scrollRef.current;
    const imgs = ad.data?.images ?? [];
    if (!el || imgs.length <= 1) return;
    const handleScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setCurrentIndex(Math.min(Math.max(idx, 0), imgs.length - 1));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [ad.data?.images]);

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
  const images = [...(data.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const price = formatDzd(data.price, t("dzd"));
  const advance = formatDzd(data.advance_payment, t("dzd"));
  const showPhone = Boolean(owner?.phone) && owner?.show_phone_number !== false;

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    if (!child) return;
    el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    setCurrentIndex(index);
  };

  async function startConversation() {
    if (!user) {
      toast.error(lang === "ar" ? "يجب تسجيل الدخول أولا" : "Connectez-vous d'abord");
      void navigate({ to: "/auth" });
      return;
    }
    if (!owner?.id || owner.id === user.id) return;
    const ownerId = owner.id;
    setBusy(true);
    try {
      const conversationId = await openConversation(data.id, user.id, ownerId);
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
          <div className="relative overflow-hidden rounded-3xl bg-muted shadow-card">
            <div
              ref={scrollRef}
              dir="ltr"
              className="flex snap-x snap-mandatory overflow-x-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {images.length ? (
                images.map((image, idx) => (
                  <div key={image.id ?? idx} className="w-full flex-shrink-0 snap-center">
                    <img
                      src={image.url}
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
                  </div>
                ))
              ) : (
                <AdPlaceholder
                  ad={data}
                  className="aspect-[16/10] w-full"
                  textClassName="text-lg sm:text-xl"
                />
              )}
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => scrollTo(Math.max(currentIndex - 1, 0))}
                  className="absolute left-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground shadow backdrop-blur transition hover:bg-background"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => scrollTo(Math.min(currentIndex + 1, images.length - 1))}
                  className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground shadow backdrop-blur transition hover:bg-background"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div dir="ltr" className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium shadow backdrop-blur">
                  <span>
                    {currentIndex + 1} / {images.length}
                  </span>
                  <div className="flex gap-1">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => scrollTo(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/40"
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </>
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
                  {owner?.role && ROLE_LABELS[owner.role][lang === "ar" ? "ar" : "fr"]}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <BlockGate otherId={owner?.id}>
              <Button
                className="w-full"
                disabled={busy || owner?.id === user?.id}
                onClick={() => void startConversation()}
              >
                <MessagesSquare className="h-4 w-4" />
                {t("message")}
              </Button>

              {showPhone ? (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <a
                      href={`https://wa.me/213${owner!.phone!.replace(/^0/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t("whatsapp")}
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href={`tel:${owner!.phone}`}>
                      <Phone className="h-4 w-4" />
                      {t("call")} · {owner!.phone}
                    </a>
                  </Button>
                </>
              ) : (
                <div className="flex items-start gap-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                  {t("noPhoneHint")}
                </div>
              )}
              </BlockGate>

              <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                <FavoriteButton adId={data.id} withLabel className="w-full py-2" />
                <ReportDialog adId={data.id} withLabel className="w-full py-2" />
              </div>
              <div className="flex justify-center">
                <BlockUserButton otherId={owner?.id} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}