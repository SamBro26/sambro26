import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
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

export interface BlockState {
  iBlocked: boolean;
  blockedMe: boolean;
}

/** Block relationship between the signed-in user and another user. */
export function useBlockState(otherId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["block", user?.id, otherId],
    enabled: Boolean(user && otherId && otherId !== user.id),
    queryFn: async (): Promise<BlockState> => {
      const { data, error } = await supabase
        .from("user_blocks" as never)
        .select("blocker_id, blocked_id")
        .or(
          `and(blocker_id.eq.${user!.id},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${user!.id})`,
        );
      if (error) throw error;
      const rows = (data ?? []) as { blocker_id: string; blocked_id: string }[];
      return {
        iBlocked: rows.some((r) => r.blocker_id === user!.id),
        blockedMe: rows.some((r) => r.blocker_id === otherId),
      };
    },
  });
}

export function BlockUserButton({ otherId, className }: { otherId?: string | null; className?: string }) {
  const { user } = useAuth();
  const { lang } = useLang();
  const qc = useQueryClient();
  const state = useBlockState(otherId);
  const ar = lang === "ar";

  const toggle = useMutation({
    mutationFn: async () => {
      if (state.data?.iBlocked) {
        const { error } = await supabase
          .from("user_blocks" as never)
          .delete()
          .eq("blocker_id", user!.id)
          .eq("blocked_id", otherId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_blocks" as never)
          .insert({ blocker_id: user!.id, blocked_id: otherId! } as never);
        if (error && error.code !== "23505") throw error;
      }
    },
    onSuccess: async () => {
      toast.success(
        state.data?.iBlocked
          ? ar ? "تم إلغاء الحظر" : "Utilisateur débloqué"
          : ar ? "تم حظر المستخدم" : "Utilisateur bloqué",
      );
      await qc.invalidateQueries({ queryKey: ["block"] });
      await qc.invalidateQueries({ queryKey: ["ad"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (!user || !otherId || otherId === user.id) return null;
  const blocked = state.data?.iBlocked;

  if (blocked) {
    return (
      <button
        type="button"
        onClick={() => toggle.mutate()}
        disabled={toggle.isPending}
        className={cn("inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted", className)}
      >
        <Ban className="h-3.5 w-3.5" />
        {ar ? "إلغاء الحظر" : "Débloquer"}
      </button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={toggle.isPending}
          className={cn("inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10", className)}
        >
          <Ban className="h-3.5 w-3.5" />
          {ar ? "حظر المستخدم" : "Bloquer"}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{ar ? "حظر هذا المستخدم؟" : "Bloquer cet utilisateur ?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {ar
              ? "لن يتمكن من مراسلتك أو رؤية رقم هاتفك أو التواصل معك. يمكنك إلغاء الحظر لاحقاً."
              : "Il ne pourra plus vous écrire, voir votre numéro ni interagir avec vous. Vous pourrez le débloquer plus tard."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{ar ? "إلغاء" : "Annuler"}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => toggle.mutate()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {ar ? "حظر" : "Bloquer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
