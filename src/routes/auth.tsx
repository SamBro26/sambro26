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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const [upName, setUpName] = useState("");
  const [upEmail, setUpEmail] = useState("");
  const [upPhone, setUpPhone] = useState("");
  const [upPassword, setUpPassword] = useState("");
  const [upRole, setUpRole] = useState<"INDIVIDUAL" | "AGENCY">("INDIVIDUAL");

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
        data: { full_name: parsed.data.fullName, phone: parsed.data.phone, role: upRole },
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
    </AppShell>
  );
}