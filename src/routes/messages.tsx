import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeId = search.c ?? null;

  const conversations = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => listConversations(user!.id),
    enabled: !!user,
  });

  const messages = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => listMessages(activeId!),
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length]);

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
    <AppShell>
      <h1 className="pb-4 font-display text-2xl font-black">{t("messages")}</h1>

      <NotificationsPanel />


      <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <Card className={cn("overflow-hidden p-0 shadow-card", activeId && "hidden md:block")}>
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
                const other = conv!.participants?.find((p) => p.user_id !== user?.id);
                const last = [...(conv!.messages ?? [])].sort((a, b) =>
                  a.created_at.localeCompare(b.created_at),
                )[conv!.messages.length - 1];
                return (
                  <li key={conv!.id}>
                    <button
                      type="button"
                      onClick={() => void navigate({ to: "/messages", search: { c: conv!.id } })}
                      className={cn(
                        "flex w-full items-center gap-3 p-3 text-start transition-colors hover:bg-muted",
                        activeId === conv!.id && "bg-muted",
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
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="flex min-h-[60vh] flex-col overflow-hidden p-0 shadow-card">
          {!activeId ? (
            <p className="m-auto p-8 text-center text-sm text-muted-foreground">
              {t("conversations")}
            </p>
          ) : (
            <>
              {activeOther && (
                <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
                  <span className="truncate text-sm font-semibold">{activeOther.profile?.full_name || "—"}</span>
                  <BlockUserButton otherId={activeOther.user_id} />
                </div>
              )}
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {(messages.data ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                      m.sender_id === user?.id
                        ? "ms-auto bg-primary text-primary-foreground"
                        : "me-auto bg-muted text-foreground",
                    )}
                  >
                    {m.content}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-border p-3">
                <BlockGate otherId={activeOther?.user_id}>
                  <form onSubmit={submit} className="flex items-center gap-2">
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={t("typeMessage")}
                      maxLength={1000}
                    />
                    <Button type="submit" size="icon" aria-label={t("send")}>
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