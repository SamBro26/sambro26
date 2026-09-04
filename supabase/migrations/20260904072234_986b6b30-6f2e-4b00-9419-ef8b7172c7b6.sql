CREATE OR REPLACE FUNCTION public.increment_ad_views(_ad_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ads
  SET views_count = views_count + 1
  WHERE id = _ad_id
    AND is_deleted = false
    AND (auth.uid() IS NULL OR auth.uid() <> user_id);
$$;

GRANT EXECUTE ON FUNCTION public.increment_ad_views(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_ad_views(uuid) TO authenticated;