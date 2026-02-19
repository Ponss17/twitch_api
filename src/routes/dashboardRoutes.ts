import express from 'express';
import * as dashboardController from '../controllers/twitch/dashboardController';
import checkToken from '../middleware/authMiddleware';

const router = express.Router();

router.get('/get-clips', checkToken, dashboardController.getClips);
router.get('/analytics', checkToken, dashboardController.getAnalytics);
router.get('/chatters', checkToken, dashboardController.getChatters);
router.get('/user-info', checkToken, dashboardController.getUserInfo);
router.get('/activity', checkToken, dashboardController.getLogs);

// Danger Zone
router.post('/clear-data', checkToken, dashboardController.clearUserData);
router.delete('/delete-account', checkToken, dashboardController.deleteAccount);

export default router;
