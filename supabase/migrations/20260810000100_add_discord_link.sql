ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS discord_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS discord_username text,
  ADD COLUMN IF NOT EXISTS discord_avatar text,
  ADD COLUMN IF NOT EXISTS discord_linked_at timestamptz,
  ADD COLUMN IF NOT EXISTS discord_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS users_discord_id_idx ON public.users (discord_id)
  WHERE discord_id IS NOT NULL;
