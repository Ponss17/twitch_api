import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import checkToken from '../../core/middleware/authMiddleware';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { heavyLimiter } from '../../core/middleware/rateLimiter';

const router = Router();

router.get('/get-clips', checkToken, heavyLimiter, dashboardController.getClips);
router.get('/analytics', checkToken, heavyLimiter, dashboardController.getAnalytics);
router.get('/chatters', checkToken, heavyLimiter, dashboardController.getChatters);
router.get('/user-info', checkToken, dashboardController.getUserInfo);
router.get('/activity', checkToken, dashboardController.getLogs);

// Danger Zone — CSRF protected
router.post('/clear-data', checkToken, csrfProtection, dashboardController.clearUserData);
router.delete('/delete-account', checkToken, csrfProtection, dashboardController.deleteAccount);

export default router;
