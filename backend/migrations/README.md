# Migraciones SQL

Las migraciones viven en `supabase/migrations/` (carpeta **local**, fuera de
GitHub). Verifícalas con `pnpm verify:migrations` en tu máquina.

No dejes `.sql` aquí: usa esa carpeta y aplícalas en el SQL Editor de Supabase
(o `supabase db push` si tienes el CLI linkeado).
