import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import * as overlayController from './overlay/controller';
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
    deleteAccountSchema,
    trackUsageSchema,
    updateTimezoneSchema
} from './dashboard.schema';
import {
    overlayToolParamSchema,
    putOverlayStateSchema,
    overlayLinkSchema
} from './overlay/schema';

const router = Router();

router.get('/get-clips', heavyRateLimiter, validate(getClipsSchema), dashboardController.getClips);
router.get(
    '/analytics',
    heavyRateLimiter,
    validate(getAnalyticsSchema),
    dashboardController.getAnalytics
);
router.get(
    '/chatters',
    heavyRateLimiter,
    validate(getChattersSchema),
    dashboardController.getChatters
);
router.get('/user-info', validate(getUserInfoSchema), dashboardController.getUserInfo);
router.get('/summary', validate(getSummarySchema), dashboardController.getSummary);
router.get('/activity', validate(getActivitySchema), dashboardController.getLogs);
router.post(
    '/track-usage',
    csrfProtection,
    validate(trackUsageSchema),
    dashboardController.trackToolUsage
);
router.put(
    '/timezone',
    csrfProtection,
    validate(updateTimezoneSchema),
    dashboardController.updateTimezone
);

router.post(
    '/clear-data',
    csrfProtection,
    validate(clearUserDataSchema),
    dashboardController.clearUserData
);
router.delete(
    '/delete-account',
    csrfProtection,
    validate(deleteAccountSchema),
    dashboardController.deleteAccount
);

router.post('/export-check', csrfProtection, dashboardController.exportCheck);
router.post('/export-complete', csrfProtection, dashboardController.recordExportComplete);

router.get(
    '/overlay-state/:tool',
    validate(overlayToolParamSchema),
    overlayController.getOverlayState
);
router.put(
    '/overlay-state/:tool',
    csrfProtection,
    validate(putOverlayStateSchema),
    overlayController.putOverlayState
);
router.post(
    '/overlay-link',
    csrfProtection,
    validate(overlayLinkSchema),
    overlayController.createOverlayLink
);

export default router;
