import { supabase } from "@/integrations/supabase/client";

/** True when the signed-in user holds the `admin` role. */
export async function checkIsAdmin(userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw error;
  return Boolean(data);
}

const ADMIN_AD_SELECT = `
  id, ad_kind, price, description, status, is_deleted, created_at, user_id,
  property_type:property_types(id, key, label_ar, label_fr, label_en),
  wilaya:wilayas(id, code, name_ar, name_fr, name_en),
  baladiya:baladiyas(id, code, name_ar, name_fr, name_en),
  owner:public_profiles(id, full_name, is_banned)
`;

export type AdminAdRow = Awaited<ReturnType<typeof listAllAdsForAdmin>>[number];

/** Every listing in the system, including hidden and reported ones. */
export async function listAllAdsForAdmin() {
  const { data, error } = await supabase
    .from("ads")
    .select(ADMIN_AD_SELECT)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

/** Soft hide / restore a listing. */
export async function setAdDeleted(adId: string, isDeleted: boolean) {
  const { error } = await supabase.from("ads").update({ is_deleted: isDeleted }).eq("id", adId);
  if (error) throw error;
}

export type AdminUserRow = Awaited<ReturnType<typeof listAllUsers>>[number];

export async function listAllUsers() {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return data ?? [];
}

export async function setUserBanned(userId: string, banned: boolean) {
  const { error } = await supabase.from("profiles").update({ is_banned: banned }).eq("id", userId);
  if (error) throw error;
}

export async function sendNotification(input: {
  userId: string;
  adminId: string;
  title?: string;
  message: string;
}) {
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    sender_id: input.adminId,
    title: input.title || null,
    message: input.message,
  });
  if (error) throw error;
}

export async function listAdminNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, title, message, is_read, created_at, recipient:public_profiles!notifications_user_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

/** Notifications addressed to the signed-in user. */
export async function listMyNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

export type AdminReportRow = Awaited<ReturnType<typeof listReports>>[number];

/** Every user report, newest first (admins only, enforced by RLS). */
export async function listReports() {
  const { data, error } = await supabase
    .from("reports")
    .select(
      `id, reason, details, status, created_at, listing_id,
       reporter:public_profiles!reports_reporter_id_fkey(id, full_name),
       listing:ads!reports_listing_id_fkey(id, description, is_deleted, user_id)`,
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function setReportStatus(reportId: string, status: "OPEN" | "REVIEWED" | "DISMISSED") {
  const { error } = await supabase.from("reports").update({ status }).eq("id", reportId);
  if (error) throw error;
}
