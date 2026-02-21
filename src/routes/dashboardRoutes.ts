import { Router } from 'express';
import * as dashboardController from '../controllers/twitch/dashboardController';
import checkToken from '../middleware/authMiddleware';
import { csrfProtection } from '../middleware/csrfProtection';

const router = Router();

router.get('/get-clips', checkToken, dashboardController.getClips);
router.get('/analytics', checkToken, dashboardController.getAnalytics);
router.get('/chatters', checkToken, dashboardController.getChatters);
router.get('/user-info', checkToken, dashboardController.getUserInfo);
router.get('/activity', checkToken, dashboardController.getLogs);

// Danger Zone — CSRF protected
router.post('/clear-data', checkToken, csrfProtection, dashboardController.clearUserData);
router.delete('/delete-account', checkToken, csrfProtection, dashboardController.deleteAccount);

export default router;
