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
  owner:profiles(id, full_name, phone, role, account_tier, avatar_url),
  images:ad_images(id, url, sort_order)
`;

export type AdRow = Awaited<ReturnType<typeof listAds>>[number];

export async function listAds(filters: AdFilters) {
  let query = supabase
    .from("ads")
    .select(AD_SELECT)
    .eq("ad_kind", filters.adKind)
    .eq("status", "ACTIVE")
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
  const { data, error } = await supabase.from("ads").select(AD_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
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

export function formatDzd(value: number | string | null | undefined, suffix: string) {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return null;
  return `${new Intl.NumberFormat("fr-DZ").format(n)} ${suffix}`;
}