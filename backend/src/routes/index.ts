import express from 'express';
import gamesRoutes from '../features/games/games.routes';
import dashboardRoutes from '../features/dashboard/dashboard.routes';
import systemRoutes from '../features/system/system.routes';
import commandsRoutes from '../features/commands/commands.routes';

const router = express.Router();

router.use('/minigames', gamesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/system', systemRoutes);
/** Rutas concretas — no usar '/' (captura /health y dispara lazy load en Vercel). */
router.use(commandsRoutes);

export default router;
