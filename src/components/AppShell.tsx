import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, MessageSquare, PlusCircle, UserRound, Languages, ShieldCheck } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAdMobBanner } from "@/hooks/useAdMobBanner";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin } from "@/lib/admin";
import { countUnreadTotal } from "@/lib/findmedz";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -end-1.5 grid min-h-4.5 min-w-4.5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground shadow-sm">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
      onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
    >
      <Languages className="h-4 w-4" />
      {lang === "ar" ? "FR" : "ع"}
    </Button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const bannerHeight = useAdMobBanner();
  const { t, dir, lang } = useLang();
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const admin = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: () => checkIsAdmin(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const queryClient = useQueryClient();

  const unread = useQuery({
    queryKey: ["unread-messages", user?.id],
    queryFn: () => countUnreadTotal(user!.id),
    enabled: !!user,
  });

  // Realtime: refresh the badge instantly on new chat messages or admin notifications.
  useEffect(() => {
    if (!user) return;
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["unread-messages", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["my-notifications", user.id] });
    };
    const channel = supabase
      .channel(`unread-badge-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        refresh,
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const unreadCount = unread.data ?? 0;

  const nav = [
    { to: "/", label: t("home"), icon: Home },
    { to: "/post", label: t("postAd"), icon: PlusCircle },
    { to: "/messages", label: t("messages"), icon: MessageSquare },
    ...(user ? [{ to: "/profile", label: t("myAds"), icon: UserRound }] : []),
    ...(admin.data
      ? [
          {
            to: "/admin",
            label: lang === "ar" ? "لوحة التحكم" : "Admin",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  return (
    <div
      dir={dir}
      className="flex min-h-screen flex-col bg-background"
      style={bannerHeight ? { paddingTop: bannerHeight } : undefined}
    >
      <header
        className="sticky z-40 bg-hero-gradient text-primary-foreground shadow-float"
        style={{ top: bannerHeight }}
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-premium-gradient font-display text-lg font-black text-accent-foreground">
              د
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg leading-tight font-extrabold">
                FindMeDZ
              </span>
              <span className="block truncate text-xs opacity-80">دبرلي</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <div className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-foreground/15",
                    pathname === item.to && "bg-primary-foreground/20",
                  )}
                >
                  {item.label}
                  {item.to === "/messages" && unreadCount > 0 && (
                    <span className="absolute -top-1 -end-1 grid min-h-4.5 min-w-4.5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground shadow-sm">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
            <LangToggle />
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
                onClick={() => void signOut()}
              >
                {t("signOut")}
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className="bg-premium-gradient text-accent-foreground hover:opacity-90"
              >
                <Link to="/auth">{t("signIn")}</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-24 md:pb-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {[
            ...nav.slice(0, 3),
            { to: user ? "/profile" : "/auth", label: t("account"), icon: UserRound },
          ].map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                  {item.to === "/messages" && <UnreadBadge count={unreadCount} />}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}