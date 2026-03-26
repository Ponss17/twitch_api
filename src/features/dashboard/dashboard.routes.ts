import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import checkToken from '../../core/middleware/authMiddleware';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { heavyLimiter } from '../../core/middleware/rateLimiter';
import { validate } from '../../core/middleware/validate';
import {
    getClipsSchema,
    getChattersSchema,
    getUserInfoSchema,
    clearUserDataSchema,
    deleteAccountSchema
} from './dashboard.schema';

const router = Router();

router.get(
    '/get-clips',
    checkToken,
    heavyLimiter,
    validate(getClipsSchema),
    dashboardController.getClips
);
router.get('/analytics', checkToken, heavyLimiter, dashboardController.getAnalytics);
router.get(
    '/chatters',
    checkToken,
    heavyLimiter,
    validate(getChattersSchema),
    dashboardController.getChatters
);
router.get('/user-info', checkToken, validate(getUserInfoSchema), dashboardController.getUserInfo);
router.get('/activity', checkToken, dashboardController.getLogs);

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
