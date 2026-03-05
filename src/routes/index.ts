import express from 'express';
import gamesRoutes from '../features/games/games.routes';
import commandsRoutes from '../features/commands/commands.routes';
import dashboardRoutes from '../features/dashboard/dashboard.routes';
import systemRoutes from '../features/system/system.routes';

const router = express.Router();

router.use('/minigames', gamesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/system', systemRoutes);

router.use('/', commandsRoutes);

export default router;
