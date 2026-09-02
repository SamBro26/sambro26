import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Réinitialiser le mot de passe — FindMeDZ دبرلي" },
      {
        name: "description",
        content: "Définissez un nouveau mot de passe pour votre compte FindMeDZ.",
      },
      { property: "og:title", content: "Nouveau mot de passe — FindMeDZ دبرلي" },
      { property: "og:description", content: "Définissez un nouveau mot de passe FindMeDZ." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // The recovery link delivers a recovery session; PASSWORD_RECOVERY confirms it.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      }
    });

    // Hash-based fallback: if a session already exists from the recovery token.
    void supabase.auth.getSession().then(({ data }) => {
      const hash = window.location.hash;
      if (data.session && (hash.includes("type=recovery") || !checking)) {
        setReady(true);
      }
      setChecking(false);
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(
        lang === "ar"
          ? "كلمة السر يجب أن تكون 6 أحرف على الأقل"
          : "Le mot de passe doit contenir au moins 6 caractères",
      );
      return;
    }
    if (password !== confirm) {
      toast.error(lang === "ar" ? "كلمتا السر غير متطابقتين" : "Les mots de passe ne correspondent pas");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      lang === "ar" ? "تم تحديث كلمة السر بنجاح" : "Mot de passe mis à jour avec succès",
    );
    void navigate({ to: "/" });
  }

  return (
    <AppShell>
      <Card className="mx-auto max-w-md shadow-card">
        <CardHeader>
          <CardTitle className="font-display">
            {lang === "ar" ? "تعيين كلمة سر جديدة" : "Nouveau mot de passe"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checking ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !ready ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <ShieldAlert className="h-10 w-10 text-destructive" />
              <p className="text-sm text-muted-foreground">
                {lang === "ar"
                  ? "رابط إعادة التعيين غير صالح أو منتهي الصلاحية. اطلب رابطًا جديدًا."
                  : "Ce lien de réinitialisation est invalide ou expiré. Veuillez en demander un nouveau."}
              </p>
              <Button variant="outline" className="w-full" onClick={() => void navigate({ to: "/auth" })}>
                {lang === "ar" ? "العودة لتسجيل الدخول" : "Retour à la connexion"}
              </Button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={handleUpdate}>
              <div className="space-y-1.5">
                <Label htmlFor="new-pass">
                  {lang === "ar" ? "كلمة السر الجديدة" : "Nouveau mot de passe"}
                </Label>
                <Input
                  id="new-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  maxLength={72}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pass">
                  {lang === "ar" ? "تأكيد كلمة السر" : "Confirmer le mot de passe"}
                </Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={6}
                  maxLength={72}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {lang === "ar" ? "حفظ كلمة السر الجديدة" : "Enregistrer"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
