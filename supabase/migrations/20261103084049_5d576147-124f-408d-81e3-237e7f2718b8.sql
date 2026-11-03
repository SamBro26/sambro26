CREATE TYPE public.user_role AS ENUM ('INDIVIDUAL','AGENCY','ADMIN');
CREATE TYPE public.account_tier AS ENUM ('FREE','PREMIUM');
CREATE TYPE public.ad_kind AS ENUM ('SUPPLY','DEMAND');
CREATE TYPE public.ad_status AS ENUM ('PENDING_REVIEW','ACTIVE','REJECTED','EXPIRED','SOLD_RENTED');
CREATE TYPE public.reaction_type AS ENUM ('LIKE','LOVE');
CREATE TYPE public.payment_method AS ENUM ('CHARGILY_EDAHABIA','CHARGILY_CIB','BARIDIMOB_MANUAL');
CREATE TYPE public.payment_status AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE public.subscription_status AS ENUM ('ACTIVE','EXPIRED','CANCELLED');
CREATE TYPE public.report_status AS ENUM ('OPEN','REVIEWED','DISMISSED');
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.wilayas (id serial PRIMARY KEY, code text NOT NULL UNIQUE, name_ar text NOT NULL, name_fr text NOT NULL, name_en text);
GRANT SELECT ON public.wilayas TO anon, authenticated;
GRANT ALL ON public.wilayas TO service_role;
GRANT USAGE ON SEQUENCE public.wilayas_id_seq TO service_role;
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wilayas public read" ON public.wilayas FOR SELECT USING (true);

CREATE TABLE public.baladiyas (
  id serial PRIMARY KEY,
  wilaya_id integer NOT NULL REFERENCES public.wilayas(id) ON DELETE RESTRICT,
  code text NOT NULL, name_ar text NOT NULL, name_fr text NOT NULL, name_en text,
  UNIQUE (wilaya_id, code)
);
CREATE INDEX idx_baladiyas_wilaya ON public.baladiyas (wilaya_id, code);
GRANT SELECT ON public.baladiyas TO anon, authenticated;
GRANT ALL ON public.baladiyas TO service_role;
GRANT USAGE ON SEQUENCE public.baladiyas_id_seq TO service_role;
ALTER TABLE public.baladiyas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "baladiyas public read" ON public.baladiyas FOR SELECT USING (true);

CREATE TABLE public.property_types (id serial PRIMARY KEY, key text NOT NULL UNIQUE, label_ar text NOT NULL, label_fr text NOT NULL, label_en text, sort_order integer NOT NULL DEFAULT 0);
GRANT SELECT ON public.property_types TO anon, authenticated;
GRANT ALL ON public.property_types TO service_role;
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "property types public read" ON public.property_types FOR SELECT USING (true);

CREATE TABLE public.transaction_types (id serial PRIMARY KEY, key text NOT NULL UNIQUE, label_ar text NOT NULL, label_fr text NOT NULL, label_en text, sort_order integer NOT NULL DEFAULT 0);
GRANT SELECT ON public.transaction_types TO anon, authenticated;
GRANT ALL ON public.transaction_types TO service_role;
ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transaction types public read" ON public.transaction_types FOR SELECT USING (true);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text UNIQUE,
  phone_verified_at timestamptz,
  email text,
  role public.user_role NOT NULL DEFAULT 'INDIVIDUAL',
  account_tier public.account_tier NOT NULL DEFAULT 'FREE',
  premium_expires_at timestamptz,
  avatar_url text,
  is_banned boolean NOT NULL DEFAULT false,
  show_phone_number boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profiles_role_idx ON public.profiles(role);
GRANT SELECT (id, full_name, phone_verified_at, role, account_tier, premium_expires_at, avatar_url, is_banned, created_at, updated_at, show_phone_number) ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles admin update" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_self_privilege()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.account_tier := OLD.account_tier;
    NEW.premium_expires_at := OLD.premium_expires_at;
    NEW.role := OLD.role;
    NEW.is_banned := OLD.is_banned;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_prevent_self_privilege BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_self_privilege();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role, show_phone_number)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''), 'INDIVIDUAL',
    COALESCE((NEW.raw_user_meta_data->>'show_phone_number')::boolean, true))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  IF lower(NEW.email) = 'body05122@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE VIEW public.public_profiles AS
SELECT id, full_name, avatar_url, role, account_tier, show_phone_number, is_banned, created_at FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;

CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_name text NOT NULL, registration_number text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agencies TO anon, authenticated;
GRANT INSERT, UPDATE ON public.agencies TO authenticated;
GRANT ALL ON public.agencies TO service_role;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agencies public read" ON public.agencies FOR SELECT USING (true);
CREATE POLICY "agencies manage own" ON public.agencies FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL, platform text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, expo_push_token)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "devices own" ON public.user_devices FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ad_kind public.ad_kind NOT NULL,
  property_type_id integer NOT NULL REFERENCES public.property_types(id),
  transaction_type_id integer NOT NULL REFERENCES public.transaction_types(id),
  wilaya_id integer NOT NULL REFERENCES public.wilayas(id),
  baladiya_id integer NOT NULL REFERENCES public.baladiyas(id),
  exact_address text, price numeric(14,2), advance_payment numeric(14,2), description text,
  status public.ad_status NOT NULL DEFAULT 'ACTIVE',
  is_featured boolean NOT NULL DEFAULT false, featured_until timestamptz,
  views_count integer NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
CREATE INDEX ads_filter_idx ON public.ads(wilaya_id, baladiya_id, property_type_id, transaction_type_id, status);
CREATE INDEX ads_featured_idx ON public.ads(is_featured, featured_until);
CREATE INDEX idx_ads_feed ON public.ads (ad_kind, status, is_featured DESC, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_ads_wilaya ON public.ads (wilaya_id) WHERE is_deleted = false;
CREATE INDEX idx_ads_baladiya ON public.ads (baladiya_id) WHERE is_deleted = false;
CREATE INDEX idx_ads_property_type ON public.ads (property_type_id);
CREATE INDEX idx_ads_transaction_type ON public.ads (transaction_type_id);
CREATE INDEX idx_ads_price ON public.ads (price) WHERE is_deleted = false;
CREATE INDEX idx_ads_user ON public.ads (user_id, created_at DESC);
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE INDEX idx_ads_description_trgm ON public.ads USING gin (description extensions.gin_trgm_ops);
GRANT SELECT ON public.ads TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.ads TO service_role;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads active public read" ON public.ads FOR SELECT USING (status = 'ACTIVE' AND is_deleted = false);
CREATE POLICY "ads owner read" ON public.ads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ads admin read" ON public.ads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ads owner insert" ON public.ads FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_banned));
CREATE POLICY "ads owner update" ON public.ads FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "ads admin update" ON public.ads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ads owner delete" ON public.ads FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER ads_updated_at BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_self_feature()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_featured := false; NEW.featured_until := NULL;
    ELSE
      NEW.is_featured := OLD.is_featured; NEW.featured_until := OLD.featured_until;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER ads_prevent_self_feature BEFORE INSERT OR UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.prevent_self_feature();

CREATE TABLE public.ad_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  url text NOT NULL, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ad_images_ad ON public.ad_images (ad_id, sort_order);
GRANT SELECT ON public.ad_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ad_images TO authenticated;
GRANT ALL ON public.ad_images TO service_role;
ALTER TABLE public.ad_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad images public read" ON public.ad_images FOR SELECT USING (true);
CREATE POLICY "ad images owner write" ON public.ad_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_id AND a.user_id = auth.uid()));

CREATE TABLE public.ad_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  keyword text NOT NULL
);
CREATE INDEX idx_ad_keywords_ad ON public.ad_keywords (ad_id);
CREATE INDEX ad_keywords_kw_idx ON public.ad_keywords(keyword);
GRANT SELECT ON public.ad_keywords TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ad_keywords TO authenticated;
GRANT ALL ON public.ad_keywords TO service_role;
ALTER TABLE public.ad_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad keywords public read" ON public.ad_keywords FOR SELECT USING (true);
CREATE POLICY "ad keywords owner write" ON public.ad_keywords FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_id AND a.user_id = auth.uid()));

CREATE TABLE public.ad_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.reaction_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ad_id, user_id, type)
);
GRANT SELECT ON public.ad_reactions TO anon, authenticated;
GRANT INSERT, DELETE ON public.ad_reactions TO authenticated;
GRANT ALL ON public.ad_reactions TO service_role;
ALTER TABLE public.ad_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions public read" ON public.ad_reactions FOR SELECT USING (true);
CREATE POLICY "reactions own write" ON public.ad_reactions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.user_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rated_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rater_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ad_id uuid REFERENCES public.ads(id) ON DELETE SET NULL,
  stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rated_user_id, rater_user_id, ad_id)
);
GRANT SELECT ON public.user_ratings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_ratings TO authenticated;
GRANT ALL ON public.user_ratings TO service_role;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings public read" ON public.user_ratings FOR SELECT USING (true);
CREATE POLICY "ratings own write" ON public.user_ratings FOR ALL TO authenticated USING (rater_user_id = auth.uid()) WITH CHECK (rater_user_id = auth.uid() AND rater_user_id <> rated_user_id);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES public.ads(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conversations_ad_idx ON public.conversations(ad_id);
CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE (conversation_id, user_id)
);
CREATE INDEX idx_conv_participants_user ON public.conversation_participants (user_id);
CREATE INDEX idx_conv_participants_conv ON public.conversation_participants (conversation_id);
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conv ON public.messages (conversation_id, created_at);
CREATE INDEX idx_messages_unread ON public.messages (conversation_id) WHERE is_read = false;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = _conversation_id AND user_id = _user_id)
$$;

CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE INDEX idx_user_blocks_blocked ON public.user_blocks (blocked_id);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks own read" ON public.user_blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid() OR blocked_id = auth.uid());
CREATE POLICY "blocks own insert" ON public.user_blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "blocks own delete" ON public.user_blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_blocked_between(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _a AND blocked_id = _b) OR (blocker_id = _b AND blocked_id = _a))
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations participant read" ON public.conversations FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.is_conversation_participant(id, auth.uid()));
CREATE POLICY "conversations create" ON public.conversations FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversation_participants TO service_role;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read" ON public.conversation_participants FOR SELECT TO authenticated USING (public.is_conversation_participant(conversation_id, auth.uid()) OR user_id = auth.uid());
CREATE POLICY "participants insert" ON public.conversation_participants FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() OR public.is_conversation_participant(conversation_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages participant read" ON public.messages FOR SELECT TO authenticated USING (public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "messages participant send" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND public.is_conversation_participant(conversation_id, auth.uid())
  AND NOT EXISTS (SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id <> auth.uid()
      AND public.is_blocked_between(auth.uid(), cp.user_id)));
CREATE POLICY "messages mark read" ON public.messages FOR UPDATE TO authenticated USING (public.is_conversation_participant(conversation_id, auth.uid())) WITH CHECK (public.is_conversation_participant(conversation_id, auth.uid()));
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, duration_days integer NOT NULL, price_dzd numeric(10,2) NOT NULL,
  features jsonb NOT NULL DEFAULT '{}'::jsonb, is_active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.subscription_plans FOR SELECT USING (true);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status public.subscription_status NOT NULL DEFAULT 'ACTIVE',
  starts_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz NOT NULL
);
CREATE INDEX subscriptions_user_idx ON public.subscriptions(user_id, status);
GRANT SELECT, INSERT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions own" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "subscriptions own insert" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  method public.payment_method NOT NULL, amount_dzd numeric(10,2) NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  chargily_transaction_id text, receipt_image_url text,
  reviewed_by_admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz
);
CREATE INDEX payments_status_idx ON public.payments(status);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments own read" ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "payments own insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.ad_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL, status public.report_status NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ad_reports TO authenticated;
GRANT ALL ON public.ad_reports TO service_role;
ALTER TABLE public.ad_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad reports own read" ON public.ad_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ad reports insert" ON public.ad_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL, target_type text NOT NULL, target_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text, message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id) WHERE is_read = false;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications read own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "notifications update own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications admin insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND sender_id = auth.uid());
CREATE POLICY "notifications admin delete" ON public.notifications FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
CREATE INDEX favorites_listing_idx ON public.favorites(listing_id);
CREATE INDEX idx_favorites_user ON public.favorites (user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own favorites" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  reason text NOT NULL, details text,
  status public.report_status NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_listing ON public.reports (listing_id);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters read own reports" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Admins read all reports" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins update reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.increment_ad_views(_ad_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.ads SET views_count = views_count + 1
  WHERE id = _ad_id AND is_deleted = false AND (auth.uid() IS NULL OR auth.uid() <> user_id);
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_listing_phone(_ad_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.phone FROM public.ads a JOIN public.profiles p ON p.id = a.user_id
  WHERE a.id = _ad_id AND a.is_deleted = false
    AND NOT public.is_blocked_between(auth.uid(), p.id)
    AND (p.show_phone_number = true OR p.id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
$$;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (id uuid, full_name text, email text, phone text, role text, account_tier text, is_banned boolean, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT p.id, p.full_name, p.email, p.phone, p.role::text, p.account_tier::text, p.is_banned, p.created_at
    FROM public.profiles p ORDER BY p.created_at DESC LIMIT 500;
END $$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_self_privilege() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_self_feature() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_blocked_between(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_listing_phone(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_listing_phone(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ad_views(uuid) TO anon, authenticated;

CREATE POLICY "owners read own listing images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'listing-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "users upload own listing images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users update own listing images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users delete own listing images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

INSERT INTO public.property_types (key, label_ar, label_fr, label_en, sort_order) VALUES
 ('apartment','شقة','Appartement','Apartment',1),('house','منزل','Maison','House',2),
 ('shop','محل تجاري','Local commercial','Shop',3),('building_land','أرض للبناء','Terrain à bâtir','Building land',4),
 ('agricultural_land','أرض فلاحية','Terrain agricole','Agricultural land',5);
INSERT INTO public.transaction_types (key, label_ar, label_fr, label_en, sort_order) VALUES
 ('sale','بيع','Vente','Sale',1),('purchase','شراء','Achat','Purchase',2),('rent','كراء','Location','Rent',3);
INSERT INTO public.subscription_plans (name, duration_days, price_dzd, features) VALUES
 ('Premium 1 mois', 30, 1500.00, '{"featuredAds":3,"unlimitedAds":true,"directContact":true}'),
 ('Premium 6 mois', 180, 7000.00, '{"featuredAds":20,"unlimitedAds":true,"directContact":true}');

INSERT INTO public.wilayas (code, name_ar, name_fr, name_en) VALUES
('01','أدرار','Adrar','Adrar'),('02','الشلف','Chlef','Chlef'),('03','الأغواط','Laghouat','Laghouat'),
('04','أم البواقي','Oum El Bouaghi','Oum El Bouaghi'),('05','باتنة','Batna','Batna'),('06','بجاية','Béjaïa','Bejaia'),
('07','بسكرة','Biskra','Biskra'),('08','بشار','Béchar','Bechar'),('09','البليدة','Blida','Blida'),
('10','البويرة','Bouira','Bouira'),('11','تمنراست','Tamanrasset','Tamanrasset'),('12','تبسة','Tébessa','Tebessa'),
('13','تلمسان','Tlemcen','Tlemcen'),('14','تيارت','Tiaret','Tiaret'),('15','تيزي وزو','Tizi Ouzou','Tizi Ouzou'),
('16','الجزائر','Alger','Algiers'),('17','الجلفة','Djelfa','Djelfa'),('18','جيجل','Jijel','Jijel'),
('19','سطيف','Sétif','Setif'),('20','سعيدة','Saïda','Saida'),('21','سكيكدة','Skikda','Skikda'),
('22','سيدي بلعباس','Sidi Bel Abbès','Sidi Bel Abbes'),('23','عنابة','Annaba','Annaba'),('24','قالمة','Guelma','Guelma'),
('25','قسنطينة','Constantine','Constantine'),('26','المدية','Médéa','Medea'),('27','مستغانم','Mostaganem','Mostaganem'),
('28','المسيلة','M''Sila','MSila'),('29','معسكر','Mascara','Mascara'),('30','ورقلة','Ouargla','Ouargla'),
('31','وهران','Oran','Oran'),('32','البيض','El Bayadh','El Bayadh'),('33','إليزي','Illizi','Illizi'),
('34','برج بوعريريج','Bordj Bou Arréridj','Bordj Bou Arreridj'),('35','بومرداس','Boumerdès','Boumerdes'),
('36','الطارف','El Tarf','El Tarf'),('37','تندوف','Tindouf','Tindouf'),('38','تيسمسيلت','Tissemsilt','Tissemsilt'),
('39','الوادي','El Oued','El Oued'),('40','خنشلة','Khenchela','Khenchela'),('41','سوق أهراس','Souk Ahras','Souk Ahras'),
('42','تيبازة','Tipaza','Tipaza'),('43','ميلة','Mila','Mila'),('44','عين الدفلى','Aïn Defla','Ain Defla'),
('45','النعامة','Naâma','Naama'),('46','عين تموشنت','Aïn Témouchent','Ain Temouchent'),('47','غرداية','Ghardaïa','Ghardaia'),
('48','غليزان','Relizane','Relizane'),('49','تيميمون','Timimoun','Timimoun'),('50','برج باجي مختار','Bordj Badji Mokhtar','Bordj Badji Mokhtar'),
('51','أولاد جلال','Ouled Djellal','Ouled Djellal'),('52','بني عباس','Béni Abbès','Beni Abbes'),('53','عين صالح','In Salah','In Salah'),
('54','عين قزام','In Guezzam','In Guezzam'),('55','تقرت','Touggourt','Touggourt'),('56','جانت','Djanet','Djanet'),
('57','المغير','El M''Ghair','El MGhair'),('58','المنيعة','El Meniaa','El Meniaa'),
('59','أفلو','Aflou','Aflou'),('60','الأبيض سيدي الشيخ','El Abiodh Sidi Cheikh','El Abiodh Sidi Cheikh'),
('61','العريشة','El Aricha','El Aricha'),('62','القنطرة','El Kantara','El Kantara'),('63','بريكة','Barika','Barika'),
('64','بوسعادة','Bou Saada','Bou Saada'),('65','بئر العاتر','Bir El Ater','Bir El Ater'),
('66','قصر البخاري','Ksar El Boukhari','Ksar El Boukhari'),('67','قصر الشلالة','Ksar Chellala','Ksar Chellala'),
('68','عين وسارة','Ain Oussara','Ain Oussara'),('69','مسعد','Messaad','Messaad');