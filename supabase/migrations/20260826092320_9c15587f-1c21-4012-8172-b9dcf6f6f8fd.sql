ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ads_user_not_deleted_idx ON public.ads (user_id) WHERE is_deleted = false;

DROP POLICY IF EXISTS "Anyone can view active ads" ON public.ads;
CREATE POLICY "Anyone can view active ads"
ON public.ads FOR SELECT
USING ((status = 'ACTIVE'::public.ad_status AND is_deleted = false) OR auth.uid() = user_id);