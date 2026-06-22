# Smoke manual en producción

Prueba rápida (~5 min) en la web desplegada (`https://www.losperris.dev/api/twitch/`), no en localhost.

Usa **ventana de incógnito** sin extensiones para evitar ruido (`spoofer.js`, etc.).

## Checklist

- [ ] **1. Landing** — Abre `/api/twitch/`. Carga sin pantalla en blanco ni errores rojos en consola.
- [ ] **2. Login Twitch** — Clic en **Conectar con Twitch** → autorizas → vuelves al **dashboard** con tu nombre/foto.
- [ ] **3. Dashboard** — Ves menú lateral, avatar arriba y pestaña Inicio. Recarga (`F5`): sigues logueado.
- [ ] **4. Pestañas + URL** — Clic en **Clips** → URL termina en `#clips`. Clic en **Shoutout** → `#shoutout`. Recarga en Clips: sigues en Clips.
- [ ] **5. Chat en vivo (TMI)** — Abre **Stalker** (o Ruleta/Tendencias) → **Iniciar/Escanear**. No sale “Error al conectar con el chat”. Si escribes en tu chat de Twitch, la herramienta reacciona.
- [ ] **6. Logout** — **Cerrar sesión** → vuelves al landing sin quedar atrapado en el dashboard.

## Si algo falla

| Síntoma | Revisar |
|---|---|
| Login no redirige | Variables OAuth en Vercel (`TWITCH_CLIENT_*`, `BASE_URL`) |
| Dashboard vacío tras login | Consola del navegador + logs Vercel (filtro `losperris-api`) |
| Error de chat | Token Twitch del usuario, canal en vivo, permisos OAuth |
| `#clips` no aparece | Hard refresh; en prod el SW sí está activo (normal) |

## Comandos útiles (local, antes de desplegar)

```bash
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e
```
