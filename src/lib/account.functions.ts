import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the caller's own account. DB rows cascade from auth.users → profiles. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Best-effort cleanup of uploaded listing images ({userId}/{adId}/file.jpg).
    try {
      const bucket = supabaseAdmin.storage.from("listing-images");
      const { data: folders } = await bucket.list(userId, { limit: 1000 });
      const paths: string[] = [];
      for (const f of folders ?? []) {
        const { data: files } = await bucket.list(`${userId}/${f.name}`, { limit: 1000 });
        for (const file of files ?? []) paths.push(`${userId}/${f.name}/${file.name}`);
      }
      if (paths.length) await bucket.remove(paths);
    } catch (e) {
      console.error("[deleteMyAccount] storage cleanup failed", e);
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
