import express from 'express';
import * as dashboardController from '../controllers/twitch/dashboardController';
import checkToken from '../middleware/authMiddleware';

const router = express.Router();

router.get('/get-clips', checkToken, dashboardController.getClips);
router.get('/analytics', checkToken, dashboardController.getAnalytics);
router.get('/chatters', checkToken, dashboardController.getChatters);
router.get('/user-info', checkToken, dashboardController.getUserInfo);

export default router;
