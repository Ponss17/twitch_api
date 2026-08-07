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
    /* codeql[js/missing-rate-limiting] */ dashboardController.revealApiKey
);

router.patch('/settings', globalRateLimiter, csrfProtection, validate(updateSettingsSchema), /* codeql[js/missing-rate-limiting] */ dashboardController.updateSettings);

router.get('/get-clips', heavyRateLimiter, validate(getClipsSchema), /* codeql[js/missing-rate-limiting] */ dashboardController.getClips);
router.get(
    '/analytics',
    globalRateLimiter,
    validate(getAnalyticsSchema),
    /* codeql[js/missing-rate-limiting] */ dashboardController.getAnalytics
);
router.get(
    '/chatters',
    heavyRateLimiter,
    validate(getChattersSchema),
    /* codeql[js/missing-rate-limiting] */ dashboardController.getChatters
);
router.get('/user-info', globalRateLimiter, validate(getUserInfoSchema), /* codeql[js/missing-rate-limiting] */ dashboardController.getUserInfo);
router.get('/summary', heavyRateLimiter, validate(getSummarySchema), /* codeql[js/missing-rate-limiting] */ dashboardController.getSummary);
router.get('/activity', globalRateLimiter, validate(getActivitySchema), /* codeql[js/missing-rate-limiting] */ dashboardController.getLogs);
router.get('/viewer-leaderboard', globalRateLimiter, validate(getViewerLeaderboardSchema), /* codeql[js/missing-rate-limiting] */ getViewerLeaderboard);
router.post(
    '/track-usage',
    globalRateLimiter,
    csrfProtection,
    validate(trackUsageSchema),
    /* codeql[js/missing-rate-limiting] */ dashboardController.trackToolUsage
);


router.post(
    '/clear-data',
    globalRateLimiter,
    csrfProtection,
    validate(clearUserDataSchema),
    /* codeql[js/missing-rate-limiting] */ dashboardController.clearUserData
);
router.delete(
    '/delete-account',
    heavyRateLimiter,
    csrfProtection,
    validate(deleteAccountSchema),
    /* codeql[js/missing-rate-limiting] */ dashboardController.deleteAccount
);

router.post('/export-check', globalRateLimiter, csrfProtection, validate(exportCheckSchema), /* codeql[js/missing-rate-limiting] */ dashboardController.exportCheck);
router.post(
    '/export-complete',
    globalRateLimiter,
    csrfProtection,
    validate(exportCompleteSchema),
    /* codeql[js/missing-rate-limiting] */ dashboardController.recordExportComplete
);

router.get(
    '/overlay-state/:tool',
    globalRateLimiter,
    validate(overlayToolParamSchema),
    /* codeql[js/missing-rate-limiting] */ overlayController.getOverlayState
);
router.put(
    '/overlay-state/:tool',
    globalRateLimiter,
    csrfProtection,
    validate(putOverlayStateSchema),
    /* codeql[js/missing-rate-limiting] */ overlayController.putOverlayState
);
router.post(
    '/overlay-link',
    globalRateLimiter,
    csrfProtection,
    validate(overlayLinkSchema),
    /* codeql[js/missing-rate-limiting] */ overlayController.createOverlayLink
);

export default router;
