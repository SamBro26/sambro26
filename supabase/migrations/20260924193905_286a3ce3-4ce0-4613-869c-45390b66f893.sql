-- Hide phone & email columns from direct client reads
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, phone_verified_at, role, account_tier, premium_expires_at, avatar_url, is_banned, created_at, updated_at, show_phone_number) ON public.profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_listing_phone(_ad_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.phone FROM public.ads a JOIN public.profiles p ON p.id = a.user_id
  WHERE a.id = _ad_id AND a.is_deleted = false
    AND (p.show_phone_number = true OR p.id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
$$;
REVOKE EXECUTE ON FUNCTION public.get_listing_phone(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_listing_phone(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (id uuid, full_name text, email text, phone text, role text, account_tier text, is_banned boolean, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT p.id, p.full_name, p.email, p.phone, p.role::text, p.account_tier::text, p.is_banned, p.created_at
    FROM public.profiles p ORDER BY p.created_at DESC LIMIT 500;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- Listing images: only the uploader (or admins) can read raw objects; viewers use pre-signed links
DROP POLICY IF EXISTS "listing images are readable" ON storage.objects;
CREATE POLICY "owners read own listing images" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'listing-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));