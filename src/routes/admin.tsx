import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EyeOff, Eye, Ban, Trash2, Send, ShieldCheck, Flag } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import { pickName, pickTypeLabel, type Lang } from "@/constants";
import { formatDzd } from "@/lib/findmedz";
import {
  checkIsAdmin,
  listAdminNotifications,
  listAllAdsForAdmin,
  listAllUsers,
  sendNotification,
  listReports,
  setAdDeleted,
  setReportStatus,
  setUserBanned,
} from "@/lib/admin";
import { deleteUserAccount } from "@/lib/admin.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Tableau de bord admin — FindMeDZ دبرلي" },
      {
        name: "description",
        content:
          "Espace d'administration FindMeDZ : modération des annonces, gestion des utilisateurs et envoi d'avertissements.",
      },
      { property: "og:title", content: "Tableau de bord admin — FindMeDZ دبرلي" },
      { property: "og:description", content: "Modération et gestion de la plateforme FindMeDZ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function typeLabel(
  row: { label_ar: string; label_fr: string; label_en: string | null } | null,
  lang: Lang,
) {
  if (!row) return "—";
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

const L = {
  ar: {
    title: "لوحة التحكم",
    posts: "إدارة المنشورات",
    users: "إدارة المستخدمين",
    notifs: "إرسال التنبيهات",
    reports: "التبليغات",
    noReports: "لا توجد تبليغات",
    reportedBy: "المبلغ",
    markReviewed: "تمت المراجعة",
    dismiss: "تجاهل",
    hide: "إخفاء",
    restore: "استرجاع",
    hidden: "مخفي",
    ban: "حظر",
    unban: "رفع الحظر",
    banned: "محظور",
    deleteAccount: "حذف الحساب",
    confirm: "تأكيد",
    cancel: "إلغاء",
    deleteAccountWarn: "سيتم حذف الحساب نهائياً. لا يمكن التراجع.",
    selectUser: "اختر المستخدم",
    msgTitle: "عنوان التنبيه (اختياري)",
    msgBody: "نص التنبيه",
    send: "إرسال التنبيه",
    sent: "تم إرسال التنبيه",
    recent: "آخر التنبيهات المرسلة",
    none: "لا توجد بيانات",
    denied: "هذه الصفحة مخصصة للمشرفين فقط",
    placeholderMsg: "منشورك يخالف شروط الاستخدام...",
  },
  fr: {
    title: "Tableau de bord",
    posts: "Modération des annonces",
    users: "Gestion des utilisateurs",
    notifs: "Envoyer des alertes",
    reports: "Signalements",
    noReports: "Aucun signalement",
    reportedBy: "Signalé par",
    markReviewed: "Traité",
    dismiss: "Ignorer",
    hide: "Masquer",
    restore: "Restaurer",
    hidden: "Masquée",
    ban: "Bannir",
    unban: "Débannir",
    banned: "Banni",
    deleteAccount: "Supprimer le compte",
    confirm: "Confirmer",
    cancel: "Annuler",
    deleteAccountWarn: "Le compte sera supprimé définitivement. Action irréversible.",
    selectUser: "Choisir l'utilisateur",
    msgTitle: "Titre (optionnel)",
    msgBody: "Message d'avertissement",
    send: "Envoyer",
    sent: "Alerte envoyée",
    recent: "Dernières alertes envoyées",
    none: "Aucune donnée",
    denied: "Page réservée aux administrateurs",
    placeholderMsg: "Votre annonce enfreint nos règles...",
  },
} as const;

function AdminPage() {
  const { lang } = useLang();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const tx = L[lang === "ar" ? "ar" : "fr"];

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const admin = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: () => checkIsAdmin(user!.id),
    enabled: !!user,
  });

  const ads = useQuery({
    queryKey: ["admin-ads"],
    queryFn: listAllAdsForAdmin,
    enabled: admin.data === true,
  });
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: listAllUsers,
    enabled: admin.data === true,
  });
  const notifs = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: listAdminNotifications,
    enabled: admin.data === true,
  });

  const hideMutation = useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) => setAdDeleted(id, hidden),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-ads"] });
      void qc.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) => setUserBanned(id, banned),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const removeUser = useServerFn(deleteUserAccount);
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => removeUser({ data: { userId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
      void qc.invalidateQueries({ queryKey: ["admin-ads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [target, setTarget] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const notifyMutation = useMutation({
    mutationFn: () =>
      sendNotification({ userId: target, adminId: user!.id, title, message: body.trim() }),
    onSuccess: () => {
      toast.success(tx.sent);
      setTitle("");
      setBody("");
      void qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const userOptions = useMemo(
    () =>
      (users.data ?? []).map((u) => ({
        id: u.id,
        label: [u.full_name || "—", u.email].filter(Boolean).join(" · "),
      })),
    [users.data],
  );

  if (loading || (user && admin.isLoading)) {
    return (
      <AppShell>
        <Skeleton className="h-64 w-full rounded-xl" />
      </AppShell>
    );
  }

  if (!admin.data) {
    return (
      <AppShell>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">{tx.denied}</CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="font-display text-2xl font-extrabold">{tx.title}</h1>
      </div>

      <Tabs defaultValue="posts">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">{tx.posts}</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <Flag className="h-4 w-4" />
            {tx.reports}
          </TabsTrigger>
          <TabsTrigger value="users">{tx.users}</TabsTrigger>
          <TabsTrigger value="notifs">{tx.notifs}</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4 space-y-3">
          {reports.isLoading && <Skeleton className="h-32 w-full rounded-xl" />}
          {reports.data?.length === 0 && <p className="text-muted-foreground">{tx.noReports}</p>}
          {reports.data?.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{report.reason}</span>
                    <Badge variant={report.status === "OPEN" ? "destructive" : "secondary"}>
                      {report.status}
                    </Badge>
                    {report.listing?.is_deleted && <Badge variant="outline">{tx.hidden}</Badge>}
                  </div>
                  {report.details && (
                    <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                      {report.details}
                    </p>
                  )}
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {report.listing?.description || "—"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tx.reportedBy}: {report.reporter?.full_name || report.reporter?.email || "—"} ·{" "}
                    {new Date(report.created_at).toLocaleString(lang === "ar" ? "ar-DZ" : "fr-DZ")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    variant={report.listing?.is_deleted ? "outline" : "destructive"}
                    size="sm"
                    className="gap-1.5"
                    disabled={hideMutation.isPending}
                    onClick={() =>
                      hideMutation.mutate({
                        id: report.listing_id,
                        hidden: !report.listing?.is_deleted,
                      })
                    }
                  >
                    {report.listing?.is_deleted ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                    {report.listing?.is_deleted ? tx.restore : tx.hide}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={statusMutation.isPending || report.status === "REVIEWED"}
                    onClick={() =>
                      statusMutation.mutate({ id: report.id, status: "REVIEWED" })
                    }
                  >
                    {tx.markReviewed}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={statusMutation.isPending || report.status === "DISMISSED"}
                    onClick={() =>
                      statusMutation.mutate({ id: report.id, status: "DISMISSED" })
                    }
                  >
                    {tx.dismiss}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="posts" className="mt-4 space-y-3">
          {ads.isLoading && <Skeleton className="h-32 w-full rounded-xl" />}
          {ads.data?.length === 0 && <p className="text-muted-foreground">{tx.none}</p>}
          {ads.data?.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {typeLabel(ad.property_type, lang)}
                    </span>
                    <Badge variant="secondary">{ad.status}</Badge>
                    {ad.is_deleted && <Badge variant="destructive">{tx.hidden}</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {ad.description || "—"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {placeName(ad.wilaya, lang)}
                    {ad.baladiya ? ` · ${placeName(ad.baladiya, lang)}` : ""}
                    {ad.price ? ` · ${formatDzd(ad.price, lang === "ar" ? "دج" : "DA")}` : ""}
                    {ad.owner?.full_name ? ` · ${ad.owner.full_name}` : ""}
                  </p>
                </div>
                <Button
                  variant={ad.is_deleted ? "outline" : "destructive"}
                  size="sm"
                  className="shrink-0 gap-1.5"
                  disabled={hideMutation.isPending}
                  onClick={() => hideMutation.mutate({ id: ad.id, hidden: !ad.is_deleted })}
                >
                  {ad.is_deleted ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {ad.is_deleted ? tx.restore : tx.hide}
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="users" className="mt-4 space-y-3">
          {users.isLoading && <Skeleton className="h-32 w-full rounded-xl" />}
          {users.data?.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{u.full_name || "—"}</span>
                    <Badge variant="secondary">{u.role}</Badge>
                    {u.is_banned && <Badge variant="destructive">{tx.banned}</Badge>}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {u.email || "—"} {u.phone ? `· ${u.phone}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={banMutation.isPending}
                    onClick={() => banMutation.mutate({ id: u.id, banned: !u.is_banned })}
                  >
                    <Ban className="h-4 w-4" />
                    {u.is_banned ? tx.unban : tx.ban}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1.5">
                        <Trash2 className="h-4 w-4" />
                        {tx.deleteAccount}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{tx.deleteAccount}</AlertDialogTitle>
                        <AlertDialogDescription>{tx.deleteAccountWarn}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{tx.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(u.id)}>
                          {tx.confirm}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="notifs" className="mt-4 space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="space-y-1.5">
                <Label>{tx.selectUser}</Label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder={tx.selectUser} />
                  </SelectTrigger>
                  <SelectContent>
                    {userOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{tx.msgTitle}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{tx.msgBody}</Label>
                <Textarea
                  rows={4}
                  value={body}
                  placeholder={tx.placeholderMsg}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <Button
                className="gap-1.5"
                disabled={!target || !body.trim() || notifyMutation.isPending}
                onClick={() => notifyMutation.mutate()}
              >
                <Send className="h-4 w-4" />
                {tx.send}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h2 className="font-semibold">{tx.recent}</h2>
            {notifs.data?.length === 0 && <p className="text-muted-foreground">{tx.none}</p>}
            {notifs.data?.map((n) => (
              <Card key={n.id}>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold">
                    {n.recipient?.full_name || n.recipient?.email || n.user_id}
                  </p>
                  {n.title && <p className="text-sm font-medium">{n.title}</p>}
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
