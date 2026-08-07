import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import * as overlayController from './overlay/controller';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { globalRateLimiter, heavyRateLimiter, revealKeyRateLimiter } from '../../core/middleware/redisRateLimiter';
import { requireDashboardAjax } from '../../core/middleware/dashboardAjaxGuard';
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
    getViewerLeaderboardSchema
} from './dashboard.schema';
import { getViewerLeaderboard } from './viewerLeaderboard.controller';
import {
    overlayToolParamSchema,
    putOverlayStateSchema,
    overlayLinkSchema,
    exportCheckSchema,
    exportCompleteSchema
} from './overlay/schema';
import { updateSettingsSchema } from './dashboard.schema';

const router = Router();


router.get(
    '/reveal-api-key',
    requireDashboardAjax,
    revealKeyRateLimiter,
    dashboardController.revealApiKey
);

router.patch('/settings', globalRateLimiter, csrfProtection, validate(updateSettingsSchema), dashboardController.updateSettings);

router.get('/get-clips', heavyRateLimiter, validate(getClipsSchema), dashboardController.getClips);
router.get(
    '/analytics',
    globalRateLimiter,
    validate(getAnalyticsSchema),
    dashboardController.getAnalytics
);
router.get(
    '/chatters',
    heavyRateLimiter,
    validate(getChattersSchema),
    dashboardController.getChatters
);
router.get('/user-info', globalRateLimiter, validate(getUserInfoSchema), dashboardController.getUserInfo);
router.get('/summary', heavyRateLimiter, validate(getSummarySchema), dashboardController.getSummary);
router.get('/activity', globalRateLimiter, validate(getActivitySchema), dashboardController.getLogs);
router.get('/viewer-leaderboard', globalRateLimiter, validate(getViewerLeaderboardSchema), getViewerLeaderboard);
router.post(
    '/track-usage',
    globalRateLimiter,
    csrfProtection,
    validate(trackUsageSchema),
    dashboardController.trackToolUsage
);


router.post(
    '/clear-data',
    globalRateLimiter,
    csrfProtection,
    validate(clearUserDataSchema),
    dashboardController.clearUserData
);
router.delete(
    '/delete-account',
    heavyRateLimiter,
    csrfProtection,
    validate(deleteAccountSchema),
    dashboardController.deleteAccount
);

router.post('/export-check', globalRateLimiter, csrfProtection, validate(exportCheckSchema), dashboardController.exportCheck);
router.post(
    '/export-complete',
    globalRateLimiter,
    csrfProtection,
    validate(exportCompleteSchema),
    dashboardController.recordExportComplete
);

router.get(
    '/overlay-state/:tool',
    globalRateLimiter,
    validate(overlayToolParamSchema),
    overlayController.getOverlayState
);
router.put(
    '/overlay-state/:tool',
    globalRateLimiter,
    csrfProtection,
    validate(putOverlayStateSchema),
    overlayController.putOverlayState
);
router.post(
    '/overlay-link',
    globalRateLimiter,
    csrfProtection,
    validate(overlayLinkSchema),
    overlayController.createOverlayLink
);

export default router;
