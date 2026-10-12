import express from 'express';
import minigamesRoutes from '../../features/minigames/minigames.routes';
import dashboardRoutes from '../../features/dashboard/dashboard.routes';
import toolsRoutes from '../../features/tools/tools.routes';
import overlayRoutes from '../../features/overlay/overlay.routes';
import systemRoutes from '../../features/system/system.routes';
import commandsRoutes from '../../features/commands/commands.routes';
import alertsRoutes from '../../features/alerts/alerts.routes';
import { eventSubIpRateLimiter } from '../middleware/redisRateLimiter';
import { twitchEventSubWebhook } from '../../features/alerts/eventsub.controller';

const router = express.Router();

/**
 * Mapa feature → path (montado bajo `/api` y `/` desde core/startup/routes.ts):
 * - features/minigames  → /minigames/*
 * - features/tools      → /dashboard/get-clips|chatters|questions|…
 * - features/overlay    → /dashboard/overlay-state|overlay-link
 * - features/dashboard  → /dashboard/* (panel, settings, reports, …)
 * - features/system     → /system/*
 * - features/alerts     → /alerts/* + webhook EventSub
 * - features/commands   → /followage, /watchtime, /shoutout, /create-clip, … (sin prefijo)
 */
// codeql[js/missing-rate-limiting]: eventSubIpRateLimiter (Redis KV; CodeQL no lo modela).
router.post(
    '/webhooks/twitch/eventsub',
    eventSubIpRateLimiter,
    /* codeql[js/missing-rate-limiting] */ twitchEventSubWebhook
);
router.use('/minigames', minigamesRoutes);
router.use('/dashboard', toolsRoutes);
router.use('/dashboard', overlayRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/system', systemRoutes);
router.use('/alerts', alertsRoutes);
/** Rutas concretas — no usar '/' (captura /health y dispara lazy load en Vercel). */
router.use(commandsRoutes);

export default router;
