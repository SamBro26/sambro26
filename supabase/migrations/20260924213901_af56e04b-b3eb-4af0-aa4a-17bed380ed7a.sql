DROP POLICY "profiles public read" ON public.profiles;

CREATE POLICY "profiles read own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.public_profiles
AS
SELECT id, full_name, avatar_url, role, account_tier, show_phone_number, is_banned, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.public_profiles TO service_role;