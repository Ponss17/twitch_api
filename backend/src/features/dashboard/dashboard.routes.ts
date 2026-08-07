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

router.use(globalRateLimiter);

router.get(
    '/reveal-api-key',
    requireDashboardAjax,
    revealKeyRateLimiter,
    /* codeql[js/missing-rate-limiting] */ dashboardController.revealApiKey
);

router.patch('/settings', csrfProtection, validate(updateSettingsSchema), /* codeql[js/missing-rate-limiting] */ dashboardController.updateSettings);

router.get('/get-clips', heavyRateLimiter, validate(getClipsSchema), /* codeql[js/missing-rate-limiting] */ dashboardController.getClips);
router.get(
    '/analytics',
    validate(getAnalyticsSchema),
    /* codeql[js/missing-rate-limiting] */ dashboardController.getAnalytics
);
router.get(
    '/chatters',
    heavyRateLimiter,
    validate(getChattersSchema),
    /* codeql[js/missing-rate-limiting] */ dashboardController.getChatters
);
router.get('/user-info', validate(getUserInfoSchema), /* codeql[js/missing-rate-limiting] */ dashboardController.getUserInfo);
router.get('/summary', validate(getSummarySchema), /* codeql[js/missing-rate-limiting] */ dashboardController.getSummary);
router.get('/activity', validate(getActivitySchema), /* codeql[js/missing-rate-limiting] */ dashboardController.getLogs);
router.get('/viewer-leaderboard', validate(getViewerLeaderboardSchema), /* codeql[js/missing-rate-limiting] */ getViewerLeaderboard);
router.post(
    '/track-usage',
    csrfProtection,
    validate(trackUsageSchema),
    /* codeql[js/missing-rate-limiting] */ dashboardController.trackToolUsage
);


router.post(
    '/clear-data',
    csrfProtection,
    validate(clearUserDataSchema),
    /* codeql[js/missing-rate-limiting] */ dashboardController.clearUserData
);
router.delete(
    '/delete-account',
    csrfProtection,
    validate(deleteAccountSchema),
    /* codeql[js/missing-rate-limiting] */ dashboardController.deleteAccount
);

router.post('/export-check', csrfProtection, validate(exportCheckSchema), /* codeql[js/missing-rate-limiting] */ dashboardController.exportCheck);
router.post(
    '/export-complete',
    csrfProtection,
    validate(exportCompleteSchema),
    /* codeql[js/missing-rate-limiting] */ dashboardController.recordExportComplete
);

router.get(
    '/overlay-state/:tool',
    validate(overlayToolParamSchema),
    /* codeql[js/missing-rate-limiting] */ overlayController.getOverlayState
);
router.put(
    '/overlay-state/:tool',
    csrfProtection,
    validate(putOverlayStateSchema),
    /* codeql[js/missing-rate-limiting] */ overlayController.putOverlayState
);
router.post(
    '/overlay-link',
    csrfProtection,
    validate(overlayLinkSchema),
    /* codeql[js/missing-rate-limiting] */ overlayController.createOverlayLink
);

export default router;
