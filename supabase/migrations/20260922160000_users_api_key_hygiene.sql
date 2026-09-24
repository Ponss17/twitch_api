-- Apply in Supabase SQL Editor (also mirrored under supabase/migrations locally).
-- Bot API key hygiene: last bot use + last rotation (no IP tracking).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS api_key_last_used_at timestamptz,
  ADD COLUMN IF NOT EXISTS api_key_rotated_at timestamptz;

-- Existing keys: treat account creation as last known rotation baseline.
UPDATE public.users
SET api_key_rotated_at = COALESCE(api_key_rotated_at, created_at)
WHERE api_key_rotated_at IS NULL AND created_at IS NOT NULL;
