# Migraciones Supabase

**Fuente de verdad versionada:** esta carpeta (`supabase/migrations/`).

Aplicar en el SQL Editor del proyecto, en orden de timestamp, o con Supabase CLI
si el proyecto está linkeado.

Son migraciones de actualización: `000000` falla pronto si no existe el esquema
base (`users`, `user_stats`, `activity_logs`, `platform_daily_stats`, `audit_logs`).

## Orden

| Archivo | Notas |
|---------|--------|
| `...000000_preflight_existing_schema.sql` | Comprueba tablas base |
| `...000100` … `...000800` | Histórico (Discord, daily stats, RLS, etc.) — ya aplicado en prod |
| `...000900_api_key_hash.sql` | Columna `users.api_key_hash` |
| `...001000_metrics_consistency.sql` | Buckets + leaderboard + clear RPC |
| `...001100_revoke_rpc_public_execute.sql` | Cierra RPCs/bot a `service_role` |
| `...001200_realtime_rls_user_id_claim.sql` | RLS Realtime solo por claim `user_id` (Twitch) |
| `...001300_streamer_questions.sql` | Historial Preguntas: tope 100 + TTL 7d + RPC prune |
| `...001400_schema_hygiene.sql` | FKs CASCADE, índices duplicados, retención 90d, RLS legacy |
| `...001500_audit_logs_user_created_idx.sql` | Índice `(user_id, created_at)` para el registro de seguridad |
| `...001600_users_account_id.sql` | `users.id` UUID interno opaco (UNIQUE); Twitch `user_id` sigue como PK |
| `...09120000_monthly_reports_notifications.sql` | Reportes mensuales + notificaciones |
| `...09123000_user_notifications_monthly_report_uidx.sql` | Índice único notificaciones de reporte |
| `...22160000_users_api_key_hygiene.sql` | Higiene / rotación de API key |

## Dónde no poner SQL

| Sitio | Uso |
|-------|-----|
| `scripts/*.{mjs,js,ts}` | Tooling de app (build, smoke, env) — **no** migraciones |
| `scripts/supabase/` | Solo borradores locales (gitignored) |
| `backend/migrations/*.sql` | No usar (gitignored); ver README allí |

## Conflictos resueltos (histórico)

1. Discord se añade antes de crear RPCs/eventos que usan sus columnas.
2. `user_daily_stats` se crea antes de reemplazar `log_user_request`.
3. La eliminación de contadores legacy ocurre después del primer refactor de la RPC.
4. El refactor de `activity_logs` es destructivo (`detail` se elimina) y queda aislado.
5. Índices y cascadas se aplican cuando todas las tablas objetivo ya existen.
6. `bot_get_user_rate_limit.sql` y `discord_link_events_session.sql` ya están
   incorporados por `bot_discord_read_access.sql`; no se ejecutan otra vez.
7. `realtime_users_bot.sql` estaba marcado obsoleto y no se migra.
8. `rls_policies.sql` y `realtime_rls_select_own.sql` definían las mismas tres
   políticas. Se conserva una sola definición, copiada de esos scripts, después
   de validar las tablas.
9. La revocación de `log_user_request` se ejecuta al final, tras su última redefinición.
10. Las RPCs `bot_*` quedan solo en `service_role` (`001100`); el bot usa `SUPABASE_BOT_KEY`.

Verificación: `pnpm verify:migrations`.
