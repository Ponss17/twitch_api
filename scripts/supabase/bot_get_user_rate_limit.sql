-- Amplía bot_get_user_by_discord_id con rate limit + cache TTL (para /cuenta y /limite).
-- Ejecutar en Supabase SQL Editor UNA vez.

DROP FUNCTION IF EXISTS public.bot_get_user_by_discord_id(text);

CREATE FUNCTION public.bot_get_user_by_discord_id(p_discord_id text)
RETURNS TABLE (
  user_id text,
  login text,
  display_name text,
  role text,
  is_active boolean,
  timezone text,
  profile_image_url text,
  last_active timestamptz,
  discord_id text,
  custom_rate_limit integer,
  custom_cache_ttl integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.user_id::text,
    u.login::text,
    COALESCE(u.display_name, u.login)::text,
    COALESCE(u.role::text, 'default'),
    COALESCE(u.is_active, true),
    COALESCE(u.timezone, 'UTC')::text,
    u.profile_image_url::text,
    u.last_active,
    u.discord_id::text,
    u.custom_rate_limit::integer,
    u.custom_cache_ttl::integer
  FROM public.users u
  WHERE u.discord_id = p_discord_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.bot_get_user_by_discord_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bot_get_user_by_discord_id(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
