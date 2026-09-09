import { Router } from 'express';
import * as analyticsController from './analytics.controller';
import * as accountController from './account.controller';
import * as settingsController from './settings.controller';
import * as overlayController from './overlay/controller';
import * as monthlyReportsController from './monthlyReports.controller';
import { getViewerLeaderboard } from './viewerLeaderboard.controller';
import toolsRoutes from '../tools/tools.routes';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { globalRateLimiter, heavyRateLimiter, revealKeyRateLimiter, destructiveAccountRateLimiter } from '../../core/middleware/redisRateLimiter';
import { requireDashboardAjax } from '../../core/middleware/dashboardAjaxGuard';
import { validate } from '../../core/middleware/validate';
import {
    getUserInfoSchema,
    getSummarySchema,
    getAnalyticsSchema,
    getActivitySchema,
    getUserAuditLogsSchema,
    clearUserDataSchema,
    deleteAccountSchema,
    getViewerLeaderboardSchema,
    updateSettingsSchema,
    ensureMonthlyReportSchema,
    listMonthlyReportsSchema,
    getMonthlyReportSchema,
    listNotificationsSchema,
    markNotificationReadSchema,
    markAllNotificationsReadSchema
} from './dashboard.schema';
import { exportCheckSchema, exportCompleteSchema } from './export.schema';
import { overlayToolParamSchema, putOverlayStateSchema, overlayLinkSchema } from './overlay/schema';

const router = Router();

/** Tools del panel: `/get-clips`, `/chatters`, `/track-usage` (mismas URLs). */
router.use(toolsRoutes);

router.get(
    '/reveal-api-key',
    requireDashboardAjax,
    revealKeyRateLimiter,
    /* codeql[js/missing-rate-limiting] */ accountController.revealApiKey
);

router.patch(
    '/settings',
    globalRateLimiter,
    csrfProtection,
    validate(updateSettingsSchema),
    /* codeql[js/missing-rate-limiting] */ settingsController.updateSettings
);

router.get(
    '/analytics',
    globalRateLimiter,
    validate(getAnalyticsSchema),
    /* codeql[js/missing-rate-limiting] */ analyticsController.getAnalytics
);
router.get('/user-info', globalRateLimiter, validate(getUserInfoSchema), /* codeql[js/missing-rate-limiting] */ accountController.getUserInfo);
router.get('/summary', heavyRateLimiter, validate(getSummarySchema), /* codeql[js/missing-rate-limiting] */ analyticsController.getSummary);
router.get('/activity', globalRateLimiter, validate(getActivitySchema), /* codeql[js/missing-rate-limiting] */ analyticsController.getLogs);
router.get(
    '/audit-logs',
    globalRateLimiter,
    validate(getUserAuditLogsSchema),
    /* codeql[js/missing-rate-limiting] */ accountController.getUserAuditLogs
);
router.get('/viewer-leaderboard', globalRateLimiter, validate(getViewerLeaderboardSchema), /* codeql[js/missing-rate-limiting] */ getViewerLeaderboard);

router.post(
    '/monthly-reports/ensure',
    globalRateLimiter,
    heavyRateLimiter,
    csrfProtection,
    validate(ensureMonthlyReportSchema),
    // codeql[js/missing-rate-limiting]: globalRateLimiter (sesiones) + heavyRateLimiter (API keys).
    monthlyReportsController.ensureMonthlyReport
);
router.get(
    '/monthly-reports',
    globalRateLimiter,
    validate(listMonthlyReportsSchema),
    /* codeql[js/missing-rate-limiting] */ monthlyReportsController.listMonthlyReports
);
router.get(
    '/monthly-reports/:yearMonth',
    globalRateLimiter,
    validate(getMonthlyReportSchema),
    /* codeql[js/missing-rate-limiting] */ monthlyReportsController.getMonthlyReport
);

router.get(
    '/notifications',
    globalRateLimiter,
    validate(listNotificationsSchema),
    /* codeql[js/missing-rate-limiting] */ monthlyReportsController.listNotifications
);
router.post(
    '/notifications/read-all',
    globalRateLimiter,
    csrfProtection,
    validate(markAllNotificationsReadSchema),
    // codeql[js/missing-rate-limiting]: globalRateLimiter (Redis KV).
    monthlyReportsController.markAllNotificationsRead
);
router.post(
    '/notifications/:id/read',
    globalRateLimiter,
    csrfProtection,
    validate(markNotificationReadSchema),
    // codeql[js/missing-rate-limiting]: globalRateLimiter (Redis KV).
    monthlyReportsController.markNotificationRead
);

router.post(
    '/clear-data',
    globalRateLimiter,
    csrfProtection,
    validate(clearUserDataSchema),
    // codeql[js/missing-rate-limiting]: globalRateLimiter + app-level limiter (Redis KV; CodeQL no lo modela).
    accountController.clearUserData
);
router.delete(
    '/delete-account',
    heavyRateLimiter,
    destructiveAccountRateLimiter,
    csrfProtection,
    validate(deleteAccountSchema),
    // codeql[js/missing-rate-limiting]: heavyRateLimiter + destructiveAccountRateLimiter (Redis KV).
    accountController.deleteAccount
);

router.post(
    '/export-check',
    globalRateLimiter,
    csrfProtection,
    validate(exportCheckSchema),
    // codeql[js/missing-rate-limiting]: globalRateLimiter + app-level limiter (Redis KV).
    settingsController.exportCheck
);
router.post(
    '/export-complete',
    globalRateLimiter,
    csrfProtection,
    validate(exportCompleteSchema),
    // codeql[js/missing-rate-limiting]: globalRateLimiter + app-level limiter (Redis KV).
    settingsController.recordExportComplete
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
