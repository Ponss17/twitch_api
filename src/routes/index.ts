import express from 'express';
import gamesRoutes from './gamesRoutes';
import commandsRoutes from './commandsRoutes';
import dashboardRoutes from './dashboardRoutes';
import systemRoutes from './systemRoutes';

const router = express.Router();

router.use('/minigames', gamesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/system', systemRoutes);

router.use('/', commandsRoutes);

export default router;
