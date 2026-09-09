import { Response } from 'express';
import { AuthenticatedRequest } from '../../types/twitch';
import { jsonError } from '../../core/utils/jsonResponse';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { safeString } from '../../core/utils/validationHelpers';
import * as monthlyReports from './monthlyReports.service';

export const ensureMonthlyReport = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        const result = await monthlyReports.ensurePreviousMonthlyReport(userId);
        return res.json({
            created: result.created,
            report: result.report
                ? {
                      id: result.report.id,
                      yearMonth: result.report.year_month,
                      createdAt: result.report.created_at,
                      summary: result.report.summary
                  }
                : null
        });
    } catch (e) {
        if (monthlyReports.isMissingRelationError(e)) {
            logger.warn('ensure monthly report: tablas pendientes de migración');
            return res.json({ created: false, report: null, pendingMigration: true });
        }
        logger.error('Error ensure monthly report:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.ANALYTICS_ERROR);
    }
};

export const listMonthlyReports = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        const reports = await monthlyReports.listMonthlyReports(userId);
        return res.json({ reports });
    } catch (e) {
        if (monthlyReports.isMissingRelationError(e)) {
            logger.warn('list monthly reports: tablas pendientes de migración');
            return res.json({ reports: [], pendingMigration: true });
        }
        logger.error('Error list monthly reports:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.ANALYTICS_ERROR);
    }
};
export const getMonthlyReport = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const yearMonth = safeString(req.params.yearMonth);
    if (!yearMonth) return jsonError(res, 400, 'Mes inválido.');

    try {
        const report = await monthlyReports.getMonthlyReport(userId, yearMonth);
        if (!report) return jsonError(res, 404, 'Reporte no encontrado.');
        return res.json({
            id: report.id,
            yearMonth: report.year_month,
            createdAt: report.created_at,
            summary: report.summary
        });
    } catch (e) {
        logger.error('Error get monthly report:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.ANALYTICS_ERROR);
    }
};

export const listNotifications = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        const notifications = await monthlyReports.listUserNotifications(userId);
        const unreadCount = notifications.filter((n) => !n.read_at).length;
        return res.json({ notifications, unreadCount });
    } catch (e) {
        if (monthlyReports.isMissingRelationError(e)) {
            return res.json({ notifications: [], unreadCount: 0, pendingMigration: true });
        }
        logger.error('Error list notifications:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.ANALYTICS_ERROR);
    }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const id = safeString(req.params.id);
    if (!id) return jsonError(res, 400, 'Notificación inválida.');

    try {
        const ok = await monthlyReports.markNotificationRead(userId, id);
        if (!ok) return jsonError(res, 404, 'Notificación no encontrada.');
        return res.json({ success: true });
    } catch (e) {
        logger.error('Error mark notification read:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.ANALYTICS_ERROR);
    }
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        const updated = await monthlyReports.markAllNotificationsRead(userId);
        return res.json({ success: true, updated });
    } catch (e) {
        logger.error('Error mark all notifications read:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.ANALYTICS_ERROR);
    }
};
