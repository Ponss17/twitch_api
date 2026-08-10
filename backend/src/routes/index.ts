import express from 'express';
import minigamesRoutes from '../features/minigames/minigames.routes';
import dashboardRoutes from '../features/dashboard/dashboard.routes';
import systemRoutes from '../features/system/system.routes';
import commandsRoutes from '../features/commands/commands.routes';

const router = express.Router();

/**
 * Mapa feature → path (montado bajo `/api` y `/` desde core/startup/routes.ts):
 * - features/minigames  → /minigames/*
 * - features/dashboard  → /dashboard/*  (incluye tools.routes: get-clips|chatters|track-usage)
 * - features/system     → /system/*
 * - features/commands   → /followage, /watchtime, /shoutout, /create-clip, … (sin prefijo)
 */
router.use('/minigames', minigamesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/system', systemRoutes);
/** Rutas concretas — no usar '/' (captura /health y dispara lazy load en Vercel). */
router.use(commandsRoutes);

export default router;
