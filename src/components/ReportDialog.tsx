import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import { reportAd } from "@/lib/findmedz";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Flag button + report modal shared by the listing cards and the detail page. */
export function ReportDialog({
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
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const ar = lang === "ar";

  async function submit() {
    if (!user) return;
    if (!reason.trim()) {
      toast.error(ar ? "اكتب سبب التبليغ" : "Indiquez le motif du signalement");
      return;
    }
    setBusy(true);
    try {
      await reportAd({
        reporterId: user.id,
        listingId: adId,
        reason: reason.trim(),
        details,
      });
      toast.success(
        ar
          ? "شكراً لك، تم إرسال التبليغ بنجاح وسيتم مراجعته"
          : "Merci, votre signalement a bien été envoyé et sera examiné",
      );
      setOpen(false);
      setReason("");
      setDetails("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={ar ? "تبليغ" : "Signaler"}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!user) {
            toast.error(ar ? "يجب تسجيل الدخول أولا" : "Connectez-vous d'abord");
            void navigate({ to: "/auth" });
            return;
          }
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          className,
        )}
      >
        <Flag className="h-4 w-4" />
        {withLabel && (ar ? "تبليغ" : "Signaler")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{ar ? "تبليغ عن الإعلان" : "Signaler cette annonce"}</DialogTitle>
            <DialogDescription>
              {ar
                ? "اشرح لنا سبب المخالفة وسيقوم الفريق بمراجعتها."
                : "Expliquez le motif ; notre équipe examinera le signalement."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="report-reason">{ar ? "السبب" : "Motif"}</Label>
              <Input
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={ar ? "إعلان مزيف، محتوى مسيء..." : "Annonce fausse, contenu abusif..."}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-details">{ar ? "تفاصيل إضافية" : "Détails"}</Label>
              <Textarea
                id="report-details"
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={ar ? "اكتب تفاصيل المخالفة..." : "Décrivez la violation..."}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              {ar ? "إلغاء" : "Annuler"}
            </Button>
            <Button onClick={() => void submit()} disabled={busy}>
              {ar ? "إرسال" : "Envoyer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
