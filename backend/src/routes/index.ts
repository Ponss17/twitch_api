import express from 'express';
import gamesRoutes from '../features/games/games.routes';
import dashboardRoutes from '../features/dashboard/dashboard.routes';
import systemRoutes from '../features/system/system.routes';
import commandsRoutes from '../features/commands/commands.routes';

const router = express.Router();

// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.use('/minigames', gamesRoutes);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.use('/dashboard', dashboardRoutes);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.use('/system', systemRoutes);
/** Rutas concretas — no usar '/' (captura /health y dispara lazy load en Vercel). */
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.use(commandsRoutes);

export default router;
