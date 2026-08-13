import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import {
  createAd,
  listBaladiyas,
  listPropertyTypes,
  listTransactionTypes,
  listWilayas,
} from "@/lib/findmedz";
import {
  chefLieuFallback,
  pickName,
  pickTypeLabel,
  transactionTypesForAdKind,
  type AdKind,
} from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/post")({
  head: () => ({
    meta: [
      { title: "Publier une annonce — FindMeDZ دبرلي" },
      {
        name: "description",
        content:
          "Publiez une offre ou une demande immobilière en quelques étapes : type de bien, localisation, prix et description.",
      },
      { property: "og:title", content: "Publier une annonce — FindMeDZ دبرلي" },
      { property: "og:description", content: "Créez votre annonce immobilière sur FindMeDZ." },
    ],
  }),
  component: PostAd,
});

const schema = z.object({
  propertyTypeId: z.number().int().positive(),
  transactionTypeId: z.number().int().positive(),
  wilayaId: z.number().int().positive(),
  baladiyaId: z.number().int().positive(),
  exactAddress: z.string().trim().max(200).optional(),
  price: z.number().nonnegative().max(9_999_999_999).nullable(),
  advancePayment: z.number().nonnegative().max(9_999_999_999).nullable(),
  description: z.string().trim().max(2000).optional(),
});

const STEP_TITLES = {
  ar: ["نوع الإعلان", "العقار والمعاملة", "الموقع", "السعر والوصف"],
  fr: ["Type d'annonce", "Bien & transaction", "Localisation", "Prix & description"],
};

function PostAd() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [adKind, setAdKind] = useState<AdKind>("SUPPLY");
  const [propertyTypeId, setPropertyTypeId] = useState<number | null>(null);
  const [transactionTypeId, setTransactionTypeId] = useState<number | null>(null);
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [baladiyaId, setBaladiyaId] = useState<number | null>(null);
  const [exactAddress, setExactAddress] = useState("");
  const [price, setPrice] = useState("");
  const [advance, setAdvance] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [busy, setBusy] = useState(false);

  const wilayas = useQuery({ queryKey: ["wilayas"], queryFn: listWilayas });
  const baladiyas = useQuery({
    queryKey: ["baladiyas", wilayaId],
    queryFn: () => listBaladiyas(wilayaId as number),
    enabled: wilayaId != null,
  });
  const propertyTypes = useQuery({ queryKey: ["property-types"], queryFn: listPropertyTypes });
  const transactionTypes = useQuery({
    queryKey: ["transaction-types"],
    queryFn: listTransactionTypes,
  });

  const allowedKeys = transactionTypesForAdKind(adKind).map((x) => x.key as string);
  const visibleTransactions = (transactionTypes.data ?? []).filter((x) =>
    allowedKeys.includes(x.key),
  );

  const titles = STEP_TITLES[lang === "ar" ? "ar" : "fr"];
  const baladiyaOptions = useMemo(() => baladiyas.data ?? [], [baladiyas.data]);
  const selectedWilaya = (wilayas.data ?? []).find((w) => w.id === wilayaId);
  // Placeholder label for wilayas whose commune list is not seeded yet.
  const chefLieu = selectedWilaya ? chefLieuFallback(selectedWilaya.code) : null;

  // Auto-select the first commune so the wizard is never blocked by a blank field.
  useEffect(() => {
    if (baladiyaId == null && baladiyaOptions.length > 0) {
      setBaladiyaId(baladiyaOptions[0].id);
    }
  }, [baladiyaId, baladiyaOptions]);

  // Baladiya only gates the step when the wilaya actually has communes loaded,
  // so partial reference data never blocks the wizard for any of the 69 wilayas.
  const baladiyaRequired = baladiyaOptions.length > 0;
  const canNext =
    (step === 0 && !!adKind) ||
    (step === 1 && propertyTypeId != null && transactionTypeId != null) ||
    (step === 2 && wilayaId != null && (!baladiyaRequired || baladiyaId != null)) ||
    step === 3;

  async function submit() {
    if (!user) {
      toast.error(lang === "ar" ? "يجب تسجيل الدخول أولا" : "Connectez-vous d'abord");
      void navigate({ to: "/auth" });
      return;
    }
    const parsed = schema.safeParse({
      propertyTypeId,
      transactionTypeId,
      wilayaId,
      baladiyaId,
      exactAddress: exactAddress || undefined,
      price: price ? Number(price) : null,
      advancePayment: advance ? Number(advance) : null,
      description: description || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setBusy(true);
    try {
      const id = await createAd(
        {
          adKind,
          ...parsed.data,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
            .slice(0, 10),
        },
        user.id,
      );
      toast.success(lang === "ar" ? "تم نشر الإعلان" : "Annonce publiée");
      void navigate({ to: "/ads/$adId", params: { adId: id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const Forward = lang === "ar" ? ArrowLeft : ArrowRight;
  const Backward = lang === "ar" ? ArrowRight : ArrowLeft;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {t("step")} {step + 1}/4
          </p>
          <h1 className="font-display text-2xl font-black">{titles[step]}</h1>
          <Progress value={((step + 1) / 4) * 100} className="mt-3 h-1.5" />
        </div>

        <Card className="shadow-card">
          <CardContent className="space-y-4 pt-6">
            {step === 0 && (
              <div className="grid grid-cols-2 gap-3">
                {(["SUPPLY", "DEMAND"] as AdKind[]).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      setAdKind(kind);
                      setTransactionTypeId(null);
                    }}
                    className={cn(
                      "rounded-2xl border-2 p-5 text-start transition-colors",
                      adKind === kind
                        ? kind === "SUPPLY"
                          ? "border-supply bg-supply/10"
                          : "border-demand bg-demand/10"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <span className="font-display text-lg font-bold">
                      {kind === "SUPPLY" ? t("supply") : t("demand")}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {kind === "SUPPLY"
                        ? lang === "ar"
                          ? "لدي عقار للبيع أو الكراء"
                          : "J'ai un bien à vendre ou à louer"
                        : lang === "ar"
                          ? "أبحث عن عقار للشراء أو الكراء"
                          : "Je cherche un bien à acheter ou louer"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label>{t("propertyType")}</Label>
                  <Select
                    value={propertyTypeId ? String(propertyTypeId) : ""}
                    onValueChange={(v) => setPropertyTypeId(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("propertyType")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(propertyTypes.data ?? []).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {pickTypeLabel(
                            {
                              labelAr: p.label_ar,
                              labelFr: p.label_fr,
                              labelEn: p.label_en ?? p.label_fr,
                            },
                            lang,
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("transactionType")}</Label>
                  <Select
                    value={transactionTypeId ? String(transactionTypeId) : ""}
                    onValueChange={(v) => setTransactionTypeId(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("transactionType")} />
                    </SelectTrigger>
                    <SelectContent>
                      {visibleTransactions.map((x) => (
                        <SelectItem key={x.id} value={String(x.id)}>
                          {pickTypeLabel(
                            {
                              labelAr: x.label_ar,
                              labelFr: x.label_fr,
                              labelEn: x.label_en ?? x.label_fr,
                            },
                            lang,
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-1.5">
                  <Label>{t("wilaya")}</Label>
                  <Select
                    value={wilayaId ? String(wilayaId) : ""}
                    onValueChange={(v) => {
                      setWilayaId(Number(v));
                      setBaladiyaId(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("wilaya")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {(wilayas.data ?? []).map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.code} ·{" "}
                          {pickName(
                            {
                              nameAr: w.name_ar,
                              nameFr: w.name_fr,
                              nameEn: w.name_en ?? w.name_fr,
                            },
                            lang,
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("baladiya")}</Label>
                  <Select
                    value={baladiyaId ? String(baladiyaId) : ""}
                    onValueChange={(v) => setBaladiyaId(Number(v))}
                    disabled={wilayaId == null}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={lang === "ar" ? "اختر البلدية" : "Sélectionner la baladiya"}
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {baladiyas.isSuccess && baladiyaOptions.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          {chefLieu
                            ? pickName(
                                {
                                  nameAr: chefLieu.nameAr,
                                  nameFr: chefLieu.nameFr,
                                  nameEn: chefLieu.nameEn,
                                },
                                lang,
                              )
                            : lang === "ar"
                              ? "لا توجد بلديات لهذه الولاية"
                              : "Aucune commune disponible"}
                        </div>
                      )}
                      {baladiyaOptions.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {pickName(
                            {
                              nameAr: b.name_ar,
                              nameFr: b.name_fr,
                              nameEn: b.name_en ?? b.name_fr,
                            },
                            lang,
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="addr">{t("address")}</Label>
                  <Input
                    id="addr"
                    value={exactAddress}
                    maxLength={200}
                    onChange={(e) => setExactAddress(e.target.value)}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="price">
                      {t("price")} ({t("dzd")})
                    </Label>
                    <Input
                      id="price"
                      inputMode="numeric"
                      value={price}
                      onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="advance">
                      {t("advance")} ({t("dzd")})
                    </Label>
                    <Input
                      id="advance"
                      inputMode="numeric"
                      value={advance}
                      onChange={(e) => setAdvance(e.target.value.replace(/[^\d]/g, ""))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="desc">{t("description")}</Label>
                  <Textarea
                    id="desc"
                    rows={5}
                    maxLength={2000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kw">
                    {lang === "ar" ? "كلمات مفتاحية (بفواصل)" : "Mots-clés (séparés par ,)"}
                  </Label>
                  <Input
                    id="kw"
                    value={keywords}
                    maxLength={200}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                <Backward className="h-4 w-4" />
                {t("back")}
              </Button>
              {step < 3 ? (
                <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                  {t("next")}
                  <Forward className="h-4 w-4" />
                </Button>
              ) : (
                <Button disabled={busy} onClick={() => void submit()}>
                  <Check className="h-4 w-4" />
                  {t("publish")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}