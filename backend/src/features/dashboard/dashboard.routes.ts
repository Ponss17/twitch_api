import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import * as overlayController from './overlay/controller';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { heavyRateLimiter, revealKeyRateLimiter } from '../../core/middleware/redisRateLimiter';
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

router.patch('/settings', csrfProtection, validate(updateSettingsSchema), dashboardController.updateSettings);

router.get('/get-clips', heavyRateLimiter, validate(getClipsSchema), dashboardController.getClips);
router.get(
    '/analytics',
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
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.get('/summary', validate(getSummarySchema), dashboardController.getSummary);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.get('/activity', validate(getActivitySchema), dashboardController.getLogs);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.get('/viewer-leaderboard', validate(getViewerLeaderboardSchema), getViewerLeaderboard);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.post(
    '/track-usage',
    csrfProtection,
    validate(trackUsageSchema),
    dashboardController.trackToolUsage
);


// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.post(
    '/clear-data',
    csrfProtection,
    validate(clearUserDataSchema),
    dashboardController.clearUserData
);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.delete(
    '/delete-account',
    csrfProtection,
    validate(deleteAccountSchema),
    dashboardController.deleteAccount
);

// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.post('/export-check', csrfProtection, validate(exportCheckSchema), dashboardController.exportCheck);
router.post(
    '/export-complete',
    csrfProtection,
    validate(exportCompleteSchema),
    dashboardController.recordExportComplete
);

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
