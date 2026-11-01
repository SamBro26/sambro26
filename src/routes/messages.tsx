import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import { listConversations, listMessages, markConversationRead, sendMessage } from "@/lib/findmedz";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { BlockGate, BlockUserButton } from "@/components/BlockUserButton";

const searchSchema = z.object({ c: z.string().uuid().optional() });

export const Route = createFileRoute("/messages")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Messages — سكنة وحانوت" },
      {
        name: "description",
        content: "Discutez directement avec les vendeurs, acheteurs et agences sur سكنة وحانوت.",
      },
      { property: "og:title", content: "Messages — سكنة وحانوت" },
      { property: "og:description", content: "Vos conversations سكنة وحانوت." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { t, lang } = useLang();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const historyRef = useRef<HTMLDivElement>(null);

  function scrollToLatest() {
    const history = historyRef.current;
    if (!history) return;
    history.scrollTo({
      top: history.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  const activeId = search.c ?? null;

  const conversations = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => user ? listConversations(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const messages = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => activeId ? listMessages(activeId) : Promise.resolve([]),
    enabled: !!activeId,
  });

  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`messages-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeId, queryClient]);

  useEffect(() => {
    scrollToLatest();
  }, [activeId, messages.data?.length]);

  useEffect(() => {
    const history = historyRef.current;
    if (!activeId || !history) return;
    // Keyboard animation shrinks this region; follow the latest message throughout.
    const observer = new ResizeObserver(scrollToLatest);
    observer.observe(history);
    return () => observer.disconnect();
  }, [activeId, loading]);

  // Mark incoming messages as read when the conversation is open.
  useEffect(() => {
    if (!activeId || !user || !messages.data) return;
    const hasUnread = messages.data.some((m) => !m.is_read && m.sender_id !== user.id);
    if (!hasUnread) return;
    void markConversationRead(activeId, user.id).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
      void queryClient.invalidateQueries({ queryKey: ["unread-messages", user.id] });
    });
  }, [activeId, user, messages.data, queryClient]);

  if (!loading && !user) {
    return (
      <AppShell>
        <div className="py-20 text-center">
          <p className="pb-4 text-muted-foreground">
            {lang === "ar" ? "سجل الدخول لعرض رسائلك" : "Connectez-vous pour voir vos messages"}
          </p>
          <Button onClick={() => void navigate({ to: "/auth" })}>{t("signIn")}</Button>
        </div>
      </AppShell>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim().slice(0, 1000);
    if (!content || !activeId || !user) return;
    setDraft("");
    try {
      await sendMessage(activeId, user.id, content);
      void queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  }

  const list = conversations.data ?? [];
  const activeOther = list
    .find((c) => c?.id === activeId)
    ?.participants?.find((p) => p.user_id !== user?.id);

  return (
    <AppShell chatView={!!activeId}>
      <h1 className="shrink-0 pb-4 font-display text-2xl font-black">{t("messages")}</h1>

      {!activeId && <NotificationsPanel />}


      <div className={cn("grid gap-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]", activeId && "min-h-0 flex-1 overflow-hidden pb-0")}>
        <Card className={cn("overflow-y-auto p-0 shadow-card", activeId && "hidden min-h-0 md:block")}>
          {conversations.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t("noConversations")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((conv) => {
                if (!conv) return null;
                const other = conv.participants?.find((p) => p.user_id !== user?.id);
                const last = [...(conv.messages ?? [])].sort((a, b) =>
                  a.created_at.localeCompare(b.created_at),
                ).at(-1);
                return (
                  <li key={conv.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void navigate({ to: "/messages", search: { c: conv.id } })}
                      className={cn(
                        "flex h-auto w-full items-center justify-start gap-3 rounded-none p-3 text-start transition-colors hover:bg-muted",
                        activeId === conv.id && "bg-muted",
                      )}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-hero-gradient font-bold text-primary-foreground">
                        {(other?.profile?.full_name || "?").slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {other?.profile?.full_name || "—"}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {last?.content ?? ""}
                        </span>
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className={cn("flex gap-0 flex-col overflow-hidden p-0 shadow-card", activeId ? "h-full min-h-0" : "min-h-[60vh]")}>
          {!activeId ? (
            <p className="m-auto p-8 text-center text-sm text-muted-foreground">
              {t("conversations")}
            </p>
          ) : (
            <>
                <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-4 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Button variant="ghost" size="icon" className="shrink-0 md:hidden" aria-label={t("conversations")} onClick={() => void navigate({ to: "/messages", search: {} })}>
                      <ArrowRight className={cn("h-4 w-4", lang !== "ar" && "rotate-180")} />
                    </Button>
                    <span className="min-w-0 truncate text-sm font-semibold">{activeOther?.profile?.full_name || "—"}</span>
                  </div>
                  {activeOther && <BlockUserButton otherId={activeOther.user_id} />}
                </div>
              <div ref={historyRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-4">
                {(messages.data ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm [overflow-wrap:anywhere] sm:max-w-[75%]",
                      m.sender_id === user?.id
                        ? "ms-auto bg-primary text-primary-foreground"
                        : "me-auto bg-muted text-foreground",
                    )}
                  >
                    {m.content}
                  </div>
                ))}
              </div>
              <div className="shrink-0 border-t border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <BlockGate otherId={activeOther?.user_id}>
                  <form onSubmit={submit} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <Input
                      className="min-w-0 text-base md:text-sm"
                      value={draft}
                      onFocus={scrollToLatest}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={t("typeMessage")}
                      maxLength={1000}
                    />
                    <Button type="submit" size="icon" className="shrink-0" aria-label={t("send")}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </BlockGate>
              </div>
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}