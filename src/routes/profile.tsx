import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Eye, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import {
  formatDzd,
  listBaladiyas,
  listMyAds,
  listPropertyTypes,
  listTransactionTypes,
  listWilayas,
  softDeleteAd,
  updateAd,
  type AdRow,
} from "@/lib/findmedz";
import { pickName, pickTypeLabel } from "@/constants";
import { checkIsAdmin } from "@/lib/admin";
import { AD_STATUS_LABELS, type AdStatus } from "@/constants/ad-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Mon profil & mes annonces — FindMeDZ دبرلي" },
      {
        name: "description",
        content:
          "Gérez votre profil FindMeDZ : consultez, modifiez ou supprimez vos annonces immobilières publiées en Algérie.",
      },
      { property: "og:title", content: "Mon profil & mes annonces — FindMeDZ دبرلي" },
      {
        property: "og:description",
        content: "Tableau de bord personnel pour gérer vos annonces immobilières.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

type Lang = "ar" | "fr" | "en";

function typeLabel(
  row: { label_ar: string; label_fr: string; label_en: string | null } | null,
  lang: Lang,
) {
  if (!row) return "";
  return pickTypeLabel(
    { labelAr: row.label_ar, labelFr: row.label_fr, labelEn: row.label_en ?? row.label_fr },
    lang,
  );
}

function placeName(
  row: { name_ar: string; name_fr: string; name_en: string | null } | null,
  lang: Lang,
) {
  if (!row) return "";
  return pickName(
    { nameAr: row.name_ar, nameFr: row.name_fr, nameEn: row.name_en ?? row.name_fr },
    lang,
  );
}

function ProfilePage() {
  const { t, lang } = useLang();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<AdRow | null>(null);
  const [deleting, setDeleting] = useState<AdRow | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const ads = useQuery({
    queryKey: ["my-ads", user?.id],
    queryFn: () => listMyAds(user!.id),
    enabled: !!user,
  });

  const isAdmin = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: () => checkIsAdmin(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await softDeleteAd(deleting.id);
      toast.success(lang === "ar" ? "تم حذف الإعلان" : "Annonce supprimée");
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ["my-ads"] });
      await queryClient.invalidateQueries({ queryKey: ["ads"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="mb-5 overflow-hidden rounded-3xl bg-hero-gradient px-5 py-6 text-primary-foreground shadow-float">
        <h1 className="font-display text-2xl font-black">
          {profile?.full_name || (lang === "ar" ? "حسابي" : "Mon compte")}
        </h1>
        <p className="mt-1 text-sm opacity-90">{profile?.email ?? user?.email}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge className="bg-primary-foreground/20">{profile?.role ?? "INDIVIDUAL"}</Badge>
          <Badge className="bg-premium-gradient text-premium-foreground">
            {profile?.account_tier ?? "FREE"}
          </Badge>
          {isAdmin.data === true && (
            <Button
              asChild
              size="sm"
              className="ms-auto gap-1.5 bg-premium-gradient text-accent-foreground hover:opacity-90"
            >
              <Link to="/admin">
                <ShieldCheck className="h-4 w-4" />
                {lang === "ar" ? "لوحة التحكم" : "Admin Panel"}
              </Link>
            </Button>
          )}
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold">{t("myAds")}</h2>
        <Button asChild size="sm" className="bg-premium-gradient text-accent-foreground">
          <Link to="/post">{t("postAd")}</Link>
        </Button>
      </div>

      {ads.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (ads.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          {lang === "ar" ? "لم تنشر أي إعلان بعد" : "Vous n'avez publié aucune annonce"}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ads.data!.map((ad) => {
            const cover = [...(ad.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
            const status = AD_STATUS_LABELS[ad.status as AdStatus];
            return (
              <Card key={ad.id} className="overflow-hidden shadow-card">
                <Link to="/ads/$adId" params={{ adId: ad.id }} className="block">
                  <div className="relative aspect-[4/3] bg-muted">
                    {cover ? (
                      <img
                        src={cover.url}
                        alt={typeLabel(ad.property_type, lang)}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-hero-gradient font-display text-3xl font-black text-primary-foreground/70">
                        دبرلي
                      </div>
                    )}
                    <Badge className="absolute top-2 ltr:left-2 rtl:right-2 bg-card text-card-foreground">
                      {status ? status[lang === "ar" ? "ar" : "fr"] : ad.status}
                    </Badge>
                  </div>
                </Link>
                <CardContent className="space-y-2 p-3">
                  <h3 className="truncate font-display text-base font-bold">
                    {typeLabel(ad.property_type, lang)} · {typeLabel(ad.transaction_type, lang)}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {placeName(ad.baladiya, lang)}، {placeName(ad.wilaya, lang)}
                    </span>
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-extrabold text-primary">
                      {formatDzd(ad.price, t("dzd")) ?? t("negotiable")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      {ad.views_count}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setEditing(ad)}>
                      <Pencil className="h-4 w-4" />
                      {lang === "ar" ? "تعديل" : "Modifier"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleting(ad)}>
                      <Trash2 className="h-4 w-4" />
                      {lang === "ar" ? "حذف" : "Supprimer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <EditAdDialog
          ad={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await queryClient.invalidateQueries({ queryKey: ["my-ads"] });
            await queryClient.invalidateQueries({ queryKey: ["ads"] });
          }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lang === "ar" ? "حذف هذا الإعلان؟" : "Supprimer cette annonce ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang === "ar"
                ? "سيختفي الإعلان من التطبيق نهائيا بالنسبة للجميع."
                : "L'annonce disparaîtra de l'application pour tout le monde."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang === "ar" ? "إلغاء" : "Annuler"}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {lang === "ar" ? "حذف" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function EditAdDialog({
  ad,
  onClose,
  onSaved,
}: {
  ad: AdRow;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { t, lang } = useLang();
  const [propertyTypeId, setPropertyTypeId] = useState<number | null>(ad.property_type?.id ?? null);
  const [transactionTypeId, setTransactionTypeId] = useState<number | null>(
    ad.transaction_type?.id ?? null,
  );
  const [wilayaId, setWilayaId] = useState<number | null>(ad.wilaya?.id ?? null);
  const [baladiyaId, setBaladiyaId] = useState<number | null>(ad.baladiya?.id ?? null);
  const [exactAddress, setExactAddress] = useState(ad.exact_address ?? "");
  const [price, setPrice] = useState(ad.price != null ? String(ad.price) : "");
  const [advance, setAdvance] = useState(
    ad.advance_payment != null ? String(ad.advance_payment) : "",
  );
  const [description, setDescription] = useState(ad.description ?? "");
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

  const baladiyaOptions = useMemo(() => baladiyas.data ?? [], [baladiyas.data]);

  async function save() {
    if (!propertyTypeId || !transactionTypeId || !wilayaId || !baladiyaId) {
      toast.error(lang === "ar" ? "أكمل الحقول المطلوبة" : "Complétez les champs requis");
      return;
    }
    setBusy(true);
    try {
      await updateAd(ad.id, {
        propertyTypeId,
        transactionTypeId,
        wilayaId,
        baladiyaId,
        exactAddress,
        price: price ? Number(price) : null,
        advancePayment: advance ? Number(advance) : null,
        description,
      });
      toast.success(lang === "ar" ? "تم حفظ التعديلات" : "Modifications enregistrées");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lang === "ar" ? "تعديل الإعلان" : "Modifier l'annonce"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
                    {typeLabel(p, lang)}
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
                {(transactionTypes.data ?? []).map((x) => (
                  <SelectItem key={x.id} value={String(x.id)}>
                    {typeLabel(x, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
                <SelectContent>
                  {(wilayas.data ?? []).map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.code} · {placeName(w, lang)}
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
                disabled={wilayaId == null || baladiyaOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("baladiya")} />
                </SelectTrigger>
                <SelectContent>
                  {baladiyaOptions.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {placeName(b, lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("address")}</Label>
            <Input value={exactAddress} onChange={(e) => setExactAddress(e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("price")}</Label>
              <Input
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("advance")}</Label>
              <Input
                inputMode="numeric"
                value={advance}
                onChange={(e) => setAdvance(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("description")}</Label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {lang === "ar" ? "إلغاء" : "Annuler"}
          </Button>
          <Button onClick={() => void save()} disabled={busy}>
            {lang === "ar" ? "حفظ" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
