-- Endurece EXECUTE / SELECT tras el linter de Supabase.
-- Pegar en SQL Editor. Idempotente.
-- Requiere que el bot Discord use service_role (SUPABASE_BOT_KEY), no la anon pública.

-- Metrics / triggers internos: no REST público.
REVOKE ALL ON FUNCTION public.aggregate_viewer_activity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aggregate_viewer_activity() FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.get_viewer_leaderboard(text, date, date, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_viewer_leaderboard(text, date, date, text, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_viewer_leaderboard(text, date, date, text, integer) TO service_role;

REVOKE ALL ON FUNCTION public.clear_user_stats_and_logs(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clear_user_stats_and_logs(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_user_stats_and_logs(text) TO service_role;

REVOKE ALL ON FUNCTION public.notify_discord_link_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_discord_link_change() FROM anon, authenticated;

-- Bot Discord: solo service_role (servidor del bot).
REVOKE ALL ON FUNCTION public.bot_get_user_by_discord_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bot_get_user_by_discord_id(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_get_user_by_discord_id(text) TO service_role;

REVOKE ALL ON FUNCTION public.bot_list_discord_links() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bot_list_discord_links() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_list_discord_links() TO service_role;

-- Tabla de eventos: no listable con anon del frontend.
DROP POLICY IF EXISTS discord_link_events_select_anon ON public.discord_link_events;
REVOKE ALL ON TABLE public.discord_link_events FROM anon, authenticated;
GRANT SELECT ON TABLE public.discord_link_events TO service_role;

NOTIFY pgrst, 'reload schema';
