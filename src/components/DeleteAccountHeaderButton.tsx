import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteMyAccount } from "@/lib/account.functions";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Red "حذف الحساب" trigger that lives in the green AppShell header.
 * Renders only on the /profile (حسابي) page so it never disturbs other screens.
 */
export function DeleteAccountHeaderButton() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const { lang } = useLang();

  // Conditional display: only while actively viewing the My Profile page.
  if (pathname !== "/profile" || !user) return null;

  return <DeleteAccountHeaderButtonInner />;
}

function DeleteAccountHeaderButtonInner() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteMyAccountFn = useServerFn(deleteMyAccount);

  const [open, setOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function confirmDeleteAccount() {
    setDeletingAccount(true);
    try {
      await deleteMyAccountFn();
      toast.success(lang === "ar" ? "تم حذف حسابك نهائياً" : "Compte supprimé définitivement");
      await supabase.auth.signOut().catch(() => undefined);
      queryClient.clear();
      setOpen(false);
      void navigate({ to: "/auth", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !deletingAccount && setOpen(o)}>
      <Button
        size="sm"
        variant="destructive"
        className="h-8 shrink-0 gap-1 px-2.5 text-xs font-bold shadow-card"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">
          {lang === "ar" ? "حذف الحساب" : "Supprimer le compte"}
        </span>
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-destructive">
            {lang === "ar" ? "حذف الحساب" : "Supprimer le compte"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base font-bold leading-relaxed text-foreground">
            {lang === "ar"
              ? "تنبيه هام: حذف الحساب سيكون نهائياً تماماً! ستفقد جميع منشوراتك، رسائلك، وأنشطتك داخل التطبيق ولا يمكن استرجاعها بأي شكل من الأشكال."
              : "Attention : la suppression du compte est définitive ! Vous perdrez toutes vos annonces, messages et activités, sans aucune possibilité de récupération."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="destructive"
            disabled={deletingAccount}
            onClick={() => void confirmDeleteAccount()}
          >
            {lang === "ar" ? "تأكيد" : "Confirmer"}
          </Button>
          <Button
            variant="outline"
            disabled={deletingAccount}
            onClick={() => setOpen(false)}
          >
            {lang === "ar" ? "تراجع" : "Annuler"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
