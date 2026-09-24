-- Apply in Supabase SQL Editor (also mirrored under supabase/migrations locally).
-- Internal opaque account UUID for Settings / support. Twitch user_id stays PK.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS id uuid;

UPDATE public.users
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE public.users
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_id_uidx ON public.users (id);
