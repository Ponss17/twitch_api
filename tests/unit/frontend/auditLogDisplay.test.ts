import { describe, expect, it } from '@jest/globals';
import { es } from '@/core/i18n/locales/es';
import {
    auditActionLabel,
    auditScopeDetail,
    formatAuditRelativeTime,
    isUserAuditAction
} from '@/features/dashboard/lib/auditLogDisplay';

describe('auditLogDisplay', () => {
    it('recognizes user-facing actions only', () => {
        expect(isUserAuditAction('session_login')).toBe(true);
        expect(isUserAuditAction('stats_cleared')).toBe(true);
        expect(isUserAuditAction('user_blocked')).toBe(false);
        expect(isUserAuditAction('nope')).toBe(false);
    });

    it('maps actions and clear-data scopes', () => {
        expect(auditActionLabel('session_login', es)).toBe('Inicio de sesión');
        expect(auditScopeDetail({ stats: true, questions: true }, es)).toBe(
            es.settings.auditLogs.scopes.both
        );
        expect(auditScopeDetail({ stats: true, questions: false }, es)).toBe(
            es.settings.auditLogs.scopes.stats
        );
        expect(auditScopeDetail({ stats: false, questions: true }, es)).toBe(
            es.settings.auditLogs.scopes.questions
        );
        expect(auditScopeDetail(undefined, es)).toBe('');
    });

    it('formats relative time buckets', () => {
        expect(formatAuditRelativeTime(new Date().toISOString(), es)).toBe(
            es.settings.auditLogs.relativeTime.now
        );
        expect(
            formatAuditRelativeTime(new Date(Date.now() - 5 * 60_000).toISOString(), es)
        ).toBe(es.settings.auditLogs.relativeTime.minutes(5));
        expect(
            formatAuditRelativeTime(new Date(Date.now() - 3 * 3_600_000).toISOString(), es)
        ).toBe(es.settings.auditLogs.relativeTime.hours(3));
        expect(
            formatAuditRelativeTime(new Date(Date.now() - 2 * 86_400_000).toISOString(), es)
        ).toBe(es.settings.auditLogs.relativeTime.days(2));
        expect(
            formatAuditRelativeTime(new Date(Date.now() - 20 * 86_400_000).toISOString(), es)
        ).toBe('');
    });
});
