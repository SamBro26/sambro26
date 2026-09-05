import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import { listMyFavoriteIds, toggleFavorite } from "@/lib/findmedz";
import { cn } from "@/lib/utils";

/** Heart toggle shared by the listing cards and the detail page. */
export function FavoriteButton({
  adId,
  className,
  withLabel = false,
}: {
  adId: string;
  className?: string;
  withLabel?: boolean;
}) {
  const { user } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const favorites = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => listMyFavoriteIds(user!.id),
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const favorited = (favorites.data ?? []).includes(adId);

  const mutation = useMutation({
    mutationFn: () => toggleFavorite(user!.id, adId, favorited),
    onSuccess: async (nowFavorited) => {
      toast.success(
        nowFavorited
          ? lang === "ar"
            ? "أُضيف إلى المفضلة"
            : "Ajouté aux favoris"
          : lang === "ar"
            ? "أُزيل من المفضلة"
            : "Retiré des favoris",
      );
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
      await queryClient.invalidateQueries({ queryKey: ["favorite-ads"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  });

  return (
    <button
      type="button"
      aria-label={lang === "ar" ? "المفضلة" : "Favori"}
      aria-pressed={favorited}
      disabled={mutation.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!user) {
          toast.error(lang === "ar" ? "يجب تسجيل الدخول أولا" : "Connectez-vous d'abord");
          void navigate({ to: "/auth" });
          return;
        }
        mutation.mutate();
      }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors",
        favorited
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
      {withLabel && (lang === "ar" ? "المفضلة" : "Favori")}
    </button>
  );
}
