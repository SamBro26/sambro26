import { supabase } from "@/integrations/supabase/client";
import type { AdKind } from "@/constants";

export interface AdFilters {
  adKind: AdKind;
  wilayaId?: number | null;
  baladiyaId?: number | null;
  propertyTypeId?: number | null;
  transactionTypeId?: number | null;
  keyword?: string;
}

const AD_SELECT = `
  id, ad_kind, price, advance_payment, description, exact_address, status,
  is_featured, views_count, created_at,
  property_type:property_types(id, key, label_ar, label_fr, label_en),
  transaction_type:transaction_types(id, key, label_ar, label_fr, label_en),
  wilaya:wilayas(id, code, name_ar, name_fr, name_en),
  baladiya:baladiyas(id, code, name_ar, name_fr, name_en),
  owner:profiles(id, full_name, show_phone_number, role, account_tier, avatar_url),
  images:ad_images(id, url, sort_order)
`;

export type AdRow = Awaited<ReturnType<typeof listAds>>[number];

export async function listAds(filters: AdFilters) {
  let query = supabase
    .from("ads")
    .select(AD_SELECT)
    .eq("ad_kind", filters.adKind)
    .eq("status", "ACTIVE")
    .eq("is_deleted", false)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  if (filters.wilayaId) query = query.eq("wilaya_id", filters.wilayaId);
  if (filters.baladiyaId) query = query.eq("baladiya_id", filters.baladiyaId);
  if (filters.propertyTypeId) query = query.eq("property_type_id", filters.propertyTypeId);
  if (filters.transactionTypeId) query = query.eq("transaction_type_id", filters.transactionTypeId);
  if (filters.keyword?.trim()) query = query.ilike("description", `%${filters.keyword.trim()}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getAd(id: string) {
  const { data, error } = await supabase
    .from("ads")
    .select(AD_SELECT)
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();
  if (error) throw error;
  if (!data) return data;
  let phone: string | null = null;
  const { data: auth } = await supabase.auth.getSession();
  if (auth.session) {
    const { data: p } = await supabase.rpc("get_listing_phone", { _ad_id: id });
    phone = (p as string | null) ?? null;
  }
  return { ...data, owner: data.owner ? { ...data.owner, phone } : data.owner };
}

const VIEWED_KEY = "findmedz_viewed_ads";

/**
 * Increment the view counter for an ad, at most once per browser session
 * (viewed IDs are kept in localStorage so refreshes don't inflate the count).
 * The database function itself skips the ad's owner.
 */
export async function trackAdView(adId: string) {
  try {
    const viewed: string[] = JSON.parse(localStorage.getItem(VIEWED_KEY) ?? "[]");
    if (viewed.includes(adId)) return;
    const { error } = await supabase.rpc("increment_ad_views", { _ad_id: adId });
    if (error) return;
    viewed.push(adId);
    // Keep the list bounded so localStorage never grows uncontrolled.
    localStorage.setItem(VIEWED_KEY, JSON.stringify(viewed.slice(-500)));
  } catch {
    // Tracking must never break the page.
  }
}

/** Ads owned by the signed-in user (any status), excluding soft-deleted ones. */
export async function listMyAds(userId: string) {
  const { data, error } = await supabase
    .from("ads")
    .select(AD_SELECT)
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface UpdateAdInput {
  propertyTypeId: number;
  transactionTypeId: number;
  wilayaId: number;
  baladiyaId: number;
  exactAddress?: string;
  price?: number | null;
  advancePayment?: number | null;
  description?: string;
}

export async function updateAd(adId: string, input: UpdateAdInput) {
  const { error } = await supabase
    .from("ads")
    .update({
      property_type_id: input.propertyTypeId,
      transaction_type_id: input.transactionTypeId,
      wilaya_id: input.wilayaId,
      baladiya_id: input.baladiyaId,
      exact_address: input.exactAddress || null,
      price: input.price ?? null,
      advance_payment: input.advancePayment ?? null,
      description: input.description || null,
    })
    .eq("id", adId);
  if (error) throw error;
}

/** Soft delete: the row stays in the database but disappears from every query. */
export async function softDeleteAd(adId: string) {
  const { error } = await supabase.from("ads").update({ is_deleted: true }).eq("id", adId);
  if (error) throw error;
}

export async function listWilayas() {
  const { data, error } = await supabase.from("wilayas").select("*").order("code");
  if (error) throw error;
  return data ?? [];
}

export async function listBaladiyas(wilayaId: number) {
  const { data, error } = await supabase
    .from("baladiyas")
    .select("*")
    .eq("wilaya_id", wilayaId)
    .order("code");
  if (error) throw error;
  return data ?? [];
}

export async function listPropertyTypes() {
  const { data, error } = await supabase.from("property_types").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function listTransactionTypes() {
  const { data, error } = await supabase.from("transaction_types").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export interface NewAdInput {
  adKind: AdKind;
  propertyTypeId: number;
  transactionTypeId: number;
  wilayaId: number;
  baladiyaId: number;
  exactAddress?: string;
  price?: number | null;
  advancePayment?: number | null;
  description?: string;
  keywords: string[];
}

export async function createAd(input: NewAdInput, userId: string) {
  const { data, error } = await supabase
    .from("ads")
    .insert({
      user_id: userId,
      ad_kind: input.adKind,
      property_type_id: input.propertyTypeId,
      transaction_type_id: input.transactionTypeId,
      wilaya_id: input.wilayaId,
      baladiya_id: input.baladiyaId,
      exact_address: input.exactAddress || null,
      price: input.price ?? null,
      advance_payment: input.advancePayment ?? null,
      description: input.description || null,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (input.keywords.length) {
    await supabase
      .from("ad_keywords")
      .insert(input.keywords.map((keyword) => ({ ad_id: data.id, keyword })));
  }
  return data.id;
}

/** Finds an existing conversation for this ad between the two users, or creates one. */
export async function openConversation(adId: string, meId: string, otherId: string) {
  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id, conversation:conversations(ad_id)")
    .eq("user_id", meId);

  const candidates = (mine ?? [])
    .filter((row) => row.conversation?.ad_id === adId)
    .map((row) => row.conversation_id);

  if (candidates.length) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherId)
      .in("conversation_id", candidates);
    if (shared?.length) return shared[0].conversation_id;
  }

  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({ ad_id: adId, created_by: meId })
    .select("id")
    .single();
  if (error) throw error;

  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: conv.id, user_id: meId },
      { conversation_id: conv.id, user_id: otherId },
    ]);
  if (partError) throw partError;

  return conv.id;
}

export async function listConversations(userId: string) {
  const { data, error } = await supabase
    .from("conversation_participants")
    .select(
      `conversation_id,
       conversation:conversations(
         id, created_at,
         ad:ads(id, description, price, property_type:property_types(label_ar, label_fr, label_en)),
         participants:conversation_participants(user_id, profile:profiles(id, full_name, avatar_url, role)),
         messages(id, content, created_at, sender_id, is_read)
       )`,
    )
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.conversation).filter(Boolean);
}

export async function listMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content });
  if (error) throw error;
}

/** Count unread messages addressed to the user (sent by others in their conversations). */
export async function countUnreadMessages(userId: string): Promise<number> {
  const { data: parts, error: partsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  if (partsError) throw partsError;
  const conversationIds = (parts ?? []).map((p) => p.conversation_id);
  if (conversationIds.length === 0) return 0;
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", conversationIds)
    .eq("is_read", false)
    .neq("sender_id", userId);
  if (error) throw error;
  return count ?? 0;
}

/** Unread admin notifications / warnings addressed to the user. */
export async function countUnreadNotifications(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}

/** Chat messages + admin notifications that the user has not read yet. */
export async function countUnreadTotal(userId: string): Promise<number> {
  const [messages, notifications] = await Promise.all([
    countUnreadMessages(userId),
    countUnreadNotifications(userId),
  ]);
  return messages + notifications;
}

/** Mark all messages in a conversation sent by others as read. */
export async function markConversationRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .eq("is_read", false)
    .neq("sender_id", userId);
  if (error) throw error;
}

export function formatDzd(value: number | string | null | undefined, suffix: string) {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return null;
  return `${new Intl.NumberFormat("fr-DZ").format(n)} ${suffix}`;
}
/* ---------------------------------- Favorites --------------------------------- */

/** IDs of the listings the user has favorited (used to fill the hearts). */
export async function listMyFavoriteIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.listing_id);
}

/** Add or remove a favorite. Returns the new favorited state. */
export async function toggleFavorite(userId: string, listingId: string, favorited: boolean) {
  if (favorited) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", listingId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, listing_id: listingId });
  if (error && error.code !== "23505") throw error;
  return true;
}

/** Full listings the user has favorited, newest first. */
export async function listFavoriteAds(userId: string): Promise<AdRow[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select(`created_at, ad:ads(${AD_SELECT})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.ad)
    .filter((ad): ad is AdRow => Boolean(ad) && !(ad as { is_deleted?: boolean }).is_deleted);
}

/* ----------------------------------- Reports ---------------------------------- */

export async function reportAd(input: {
  reporterId: string;
  listingId: string;
  reason: string;
  details?: string;
}) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: input.reporterId,
    listing_id: input.listingId,
    reason: input.reason,
    details: input.details?.trim() || null,
  });
  if (error) throw error;
}
