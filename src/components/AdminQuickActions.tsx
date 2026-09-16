import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import { setAdDeleted, setUserBanned } from "@/lib/admin";
import { cn } from "@/lib/utils";
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

const SUPER_ADMIN_EMAIL = "body05122@gmail.com";

/** True only for the super admin account. */
export function useIsSuperAdmin() {
  const { user } = useAuth();
  return (user?.email ?? "").toLowerCase() === SUPER_ADMIN_EMAIL;
}

/** Inline moderation buttons rendered on listing cards for the super admin only. */
export function AdminQuickActions({
  adId,
  ownerId,
  className,
}: {
  adId: string;
  ownerId?: string | null;
  className?: string;
}) {
  const isAdmin = useIsSuperAdmin();
  const { lang } = useLang();
  const queryClient = useQueryClient();

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["ads"] }),
      queryClient.invalidateQueries({ queryKey: ["favorite-ads"] }),
      queryClient.invalidateQueries({ queryKey: ["my-ads"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    ]);
  };

  const remove = useMutation({
    mutationFn: () => setAdDeleted(adId, true),
    onSuccess: async () => {
      toast.success(lang === "ar" ? "تم حذف المنشور" : "Annonce supprimée");
      await refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  });

  const ban = useMutation({
    mutationFn: () => setUserBanned(ownerId!, true),
    onSuccess: async () => {
      toast.success(lang === "ar" ? "تم حظر المعلن" : "Annonceur banni");
      await refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  });

  if (!isAdmin) return null;

  const stop = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const btn =
    "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium transition-colors";

  return (
    <div
      onClick={stop}
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 p-1.5",
        className,
      )}
    >
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            onClick={stop}
            disabled={remove.isPending}
            className={cn(btn, "bg-destructive/10 text-destructive hover:bg-destructive/20")}
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{lang === "ar" ? "حذف المنشور" : "Supprimer"}</span>
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={stop}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lang === "ar" ? "حذف هذا المنشور؟" : "Supprimer cette annonce ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang === "ar"
                ? "سيتم إخفاء الإعلان من جميع الصفحات ويمكن استرجاعه من لوحة التحكم."
                : "L'annonce sera masquée partout et pourra être restaurée depuis le panneau admin."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang === "ar" ? "إلغاء" : "Annuler"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                stop(event);
                remove.mutate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {lang === "ar" ? "حذف" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {ownerId && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              onClick={stop}
              disabled={ban.isPending}
              className={cn(btn, "bg-muted text-foreground hover:bg-muted/70")}
            >
              <Ban className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{lang === "ar" ? "حظر المعلن" : "Bannir"}</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={stop}>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {lang === "ar" ? "حظر صاحب هذا الإعلان؟" : "Bannir cet annonceur ?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {lang === "ar"
                  ? "لن يتمكن المستخدم من استعمال الحساب حتى يرفع المشرف الحظر."
                  : "L'utilisateur sera bloqué jusqu'à la levée du bannissement."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{lang === "ar" ? "إلغاء" : "Annuler"}</AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  stop(event);
                  ban.mutate();
                }}
              >
                {lang === "ar" ? "حظر" : "Bannir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
