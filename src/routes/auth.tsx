import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MailCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS, TIER_LABELS } from "@/constants";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — FindMeDZ دبرلي" },
      {
        name: "description",
        content: "Connectez-vous ou créez un compte particulier ou agence sur FindMeDZ.",
      },
      { property: "og:title", content: "Connexion — FindMeDZ دبرلي" },
      { property: "og:description", content: "Accédez à vos annonces et messages FindMeDZ." },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z
    .string()
    .trim()
    .regex(/^0[5-7][0-9]{8}$/, "0X XX XX XX XX"),
  password: z.string().min(6).max(72),
});

function AuthPage() {
  const { t, lang } = useLang();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const [inEmail, setInEmail] = useState("");
  const [inPassword, setInPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const [upName, setUpName] = useState("");
  const [upEmail, setUpEmail] = useState("");
  const [upPhone, setUpPhone] = useState("");
  const [upPassword, setUpPassword] = useState("");
  const [upRole, setUpRole] = useState<"INDIVIDUAL" | "AGENCY">("INDIVIDUAL");
  const [upShowPhone, setUpShowPhone] = useState(true);

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    const email = z.string().trim().email().max(255).safeParse(forgotEmail);
    if (!email.success) {
      toast.error(lang === "ar" ? "أدخل بريدًا إلكترونيًا صالحًا" : "Entrez un e-mail valide");
      return;
    }
    setForgotBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForgotSent(true);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: inEmail.trim(),
      password: inPassword,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("مرحبا بك / Bienvenue");
    void navigate({ to: "/" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({
      fullName: upName,
      email: upEmail,
      phone: upPhone,
      password: upPassword,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
          role: upRole,
          show_phone_number: upShowPhone,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تحقق من بريدك الإلكتروني لتأكيد الحساب / Vérifiez votre e-mail");
  }

  if (user && profile) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-md shadow-card">
          <CardHeader>
            <CardTitle className="font-display">{profile.full_name || profile.email}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t("account")}: </span>
              {ROLE_LABELS[profile.role][lang === "ar" ? "ar" : "fr"]} ·{" "}
              {TIER_LABELS[profile.account_tier][lang === "ar" ? "ar" : "fr"]}
            </p>
            {profile.phone && <p className="text-muted-foreground">{profile.phone}</p>}
            <Button className="mt-3 w-full" onClick={() => void navigate({ to: "/post" })}>
              {t("postAd")}
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Card className="mx-auto max-w-md shadow-card">
        <CardHeader>
          <CardTitle className="font-display">FindMeDZ دبرلي</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="in">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="in">{t("signIn")}</TabsTrigger>
              <TabsTrigger value="up">{lang === "ar" ? "حساب جديد" : "Créer un compte"}</TabsTrigger>
            </TabsList>

            <TabsContent value="in">
              <form className="space-y-3 pt-4" onSubmit={handleSignIn}>
                <div className="space-y-1.5">
                  <Label htmlFor="in-email">Email</Label>
                  <Input
                    id="in-email"
                    type="email"
                    value={inEmail}
                    onChange={(e) => setInEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="in-pass">{lang === "ar" ? "كلمة السر" : "Mot de passe"}</Label>
                  <Input
                    id="in-pass"
                    type="password"
                    value={inPassword}
                    onChange={(e) => setInPassword(e.target.value)}
                    required
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(inEmail);
                        setForgotSent(false);
                        setForgotOpen(true);
                      }}
                      className="text-xs text-primary underline-offset-4 hover:underline"
                    >
                      {lang === "ar" ? "نسيت كلمة السر؟" : "Mot de passe oublié ?"}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {t("signIn")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="up">
              <form className="space-y-3 pt-4" onSubmit={handleSignUp}>
                <div className="space-y-1.5">
                  <Label htmlFor="up-name">{lang === "ar" ? "الاسم الكامل" : "Nom complet"}</Label>
                  <Input
                    id="up-name"
                    value={upName}
                    onChange={(e) => setUpName(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="up-email">Email</Label>
                  <Input
                    id="up-email"
                    type="email"
                    value={upEmail}
                    onChange={(e) => setUpEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="up-phone">{lang === "ar" ? "رقم الهاتف" : "Téléphone"}</Label>
                  <Input
                    id="up-phone"
                    inputMode="tel"
                    placeholder="0555 12 34 56"
                    value={upPhone}
                    onChange={(e) => setUpPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "ar" ? "نوع الحساب" : "Type de compte"}</Label>
                  <Select value={upRole} onValueChange={(v) => setUpRole(v as typeof upRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">
                        {ROLE_LABELS.INDIVIDUAL[lang === "ar" ? "ar" : "fr"]}
                      </SelectItem>
                      <SelectItem value="AGENCY">
                        {ROLE_LABELS.AGENCY[lang === "ar" ? "ar" : "fr"]}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="up-pass">{lang === "ar" ? "كلمة السر" : "Mot de passe"}</Label>
                  <Input
                    id="up-pass"
                    type="password"
                    value={upPassword}
                    onChange={(e) => setUpPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {lang === "ar" ? "إنشاء الحساب" : "Créer le compte"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              {lang === "ar" ? "نسيت كلمة السر" : "Mot de passe oublié"}
            </DialogTitle>
            <DialogDescription>
              {lang === "ar"
                ? "أدخل بريدك الإلكتروني المسجل وسنرسل لك رابط إعادة التعيين."
                : "Entrez votre e-mail enregistré et nous vous enverrons un lien de réinitialisation."}
            </DialogDescription>
          </DialogHeader>

          {forgotSent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <MailCheck className="h-10 w-10 text-primary" />
              <p className="text-sm text-foreground">
                {lang === "ar"
                  ? "تم إرسال رابط إعادة تعيين كلمة السر إلى بريدك الإلكتروني."
                  : "Un lien de réinitialisation a été envoyé à votre e-mail."}
              </p>
              <Button variant="outline" className="w-full" onClick={() => setForgotOpen(false)}>
                {lang === "ar" ? "حسنًا" : "OK"}
              </Button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={handleForgot}>
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={forgotBusy}>
                {forgotBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                {lang === "ar" ? "إرسال رابط إعادة التعيين" : "Envoyer le lien"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}