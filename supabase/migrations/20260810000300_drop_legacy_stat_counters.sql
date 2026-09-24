-- Destructiva pero compatible con la RPC instalada en 00200.
ALTER TABLE public.user_stats
  DROP COLUMN IF EXISTS clips_count,
  DROP COLUMN IF EXISTS followage_count,
  DROP COLUMN IF EXISTS so_count,
  DROP COLUMN IF EXISTS stalker_count,
  DROP COLUMN IF EXISTS trends_count,
  DROP COLUMN IF EXISTS roulette_count,
  DROP COLUMN IF EXISTS message_count,
  DROP COLUMN IF EXISTS russian_count,
  DROP COLUMN IF EXISTS magic8_count,
  DROP COLUMN IF EXISTS duel_count;
