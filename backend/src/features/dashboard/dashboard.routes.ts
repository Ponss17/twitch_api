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
    trackUsageSchema
} from './dashboard.schema';
import {
    overlayToolParamSchema,
    putOverlayStateSchema,
    overlayLinkSchema,
    exportCheckSchema,
    exportCompleteSchema
} from './overlay/schema';
import { updateSettingsSchema } from './dashboard.schema';

const router = Router();

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
router.get('/summary', validate(getSummarySchema), dashboardController.getSummary);
router.get('/activity', validate(getActivitySchema), dashboardController.getLogs);
router.post(
    '/track-usage',
    csrfProtection,
    validate(trackUsageSchema),
    dashboardController.trackToolUsage
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
