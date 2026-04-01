import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import checkToken from '../../core/middleware/authMiddleware';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { heavyRateLimiter } from '../../core/middleware/redisRateLimiter';
import { validate } from '../../core/middleware/validate';
import {
    getClipsSchema,
    getChattersSchema,
    getUserInfoSchema,
    getSummarySchema,
    getAnalyticsSchema,
    getActivitySchema,
    clearUserDataSchema,
    deleteAccountSchema
} from './dashboard.schema';

const router = Router();

router.get(
    '/get-clips',
    checkToken,
    heavyRateLimiter,
    validate(getClipsSchema),
    dashboardController.getClips
);
router.get(
    '/analytics',
    checkToken,
    heavyRateLimiter,
    validate(getAnalyticsSchema),
    dashboardController.getAnalytics
);
router.get(
    '/chatters',
    checkToken,
    heavyRateLimiter,
    validate(getChattersSchema),
    dashboardController.getChatters
);
router.get('/user-info', checkToken, validate(getUserInfoSchema), dashboardController.getUserInfo);
router.get('/summary', checkToken, validate(getSummarySchema), dashboardController.getSummary);
router.get('/activity', checkToken, validate(getActivitySchema), dashboardController.getLogs);
router.post('/track-usage', checkToken, dashboardController.trackToolUsage);
router.put('/timezone', checkToken, dashboardController.updateTimezone);

// Danger Zone — CSRF protected with validation
router.post(
    '/clear-data',
    checkToken,
    csrfProtection,
    validate(clearUserDataSchema),
    dashboardController.clearUserData
);
router.delete(
    '/delete-account',
    checkToken,
    csrfProtection,
    validate(deleteAccountSchema),
    dashboardController.deleteAccount
);

export default router;
