-- Permite eventos de sesión del panel en discord_link_events (DM bot).
-- Ejecutar una vez en Supabase SQL Editor (prod).
-- Eventos: linked | unlinked | session_login | session_logout

ALTER TABLE public.discord_link_events
  DROP CONSTRAINT IF EXISTS discord_link_events_event_check;

ALTER TABLE public.discord_link_events
  ADD CONSTRAINT discord_link_events_event_check
  CHECK (event IN ('linked', 'unlinked', 'session_login', 'session_logout'));

COMMENT ON TABLE public.discord_link_events IS
  'Eventos para el bot (Realtime): vínculo Discord y sesión panel (login/logout).';

NOTIFY pgrst, 'reload schema';
