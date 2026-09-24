import express from 'express';
import minigamesRoutes from '../features/minigames/minigames.routes';
import dashboardRoutes from '../features/dashboard/dashboard.routes';
import systemRoutes from '../features/system/system.routes';
import commandsRoutes from '../features/commands/commands.routes';
import alertsRoutes from '../features/alerts/alerts.routes';
import { eventSubIpRateLimiter } from '../core/middleware/redisRateLimiter';
import { twitchEventSubWebhook } from '../features/alerts/eventsub.controller';

const router = express.Router();

/**
 * Mapa feature → path (montado bajo `/api` y `/` desde core/startup/routes.ts):
 * - features/minigames  → /minigames/*
 * - features/dashboard  → /dashboard/*  (incluye tools.routes: get-clips|chatters|track-usage)
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
router.use('/dashboard', dashboardRoutes);
router.use('/system', systemRoutes);
router.use('/alerts', alertsRoutes);
/** Rutas concretas — no usar '/' (captura /health y dispara lazy load en Vercel). */
router.use(commandsRoutes);

export default router;
