import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import { listMyNotifications, markNotificationRead } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Admin warnings addressed to the signed-in user. */
export function NotificationsPanel() {
  const { user } = useAuth();
  const { lang } = useLang();
  const qc = useQueryClient();

  const notifications = useQuery({
    queryKey: ["my-notifications", user?.id],
    queryFn: () => listMyNotifications(user!.id),
    enabled: !!user,
  });

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-notifications", user?.id] });
      void qc.invalidateQueries({ queryKey: ["unread-messages", user?.id] });
    },
  });

  const items = notifications.data ?? [];
  if (!user || items.length === 0) return null;

  return (
    <section className="pb-4">
      <h2 className="flex items-center gap-2 pb-2 font-semibold">
        <Bell className="h-4 w-4 text-primary" />
        {lang === "ar" ? "التنبيهات" : "Notifications"}
      </h2>
      <div className="space-y-2">
        {items.map((n) => (
          <Card key={n.id} className={cn(!n.is_read && "border-primary/50 bg-primary/5")}>
            <CardContent className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                {n.title && <p className="text-sm font-semibold">{n.title}</p>}
                <p className="text-sm text-muted-foreground">{n.message}</p>
              </div>
              {!n.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => readMutation.mutate(n.id)}
                >
                  <Check className="h-4 w-4" />
                  {lang === "ar" ? "تم" : "Lu"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
