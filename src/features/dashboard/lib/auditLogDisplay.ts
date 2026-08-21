import type { Translations } from '@/core/i18n/locales/es';
import { getBcp47, type Locale } from '@/core/i18n/I18nContext';

export const USER_AUDIT_ACTIONS = [
    'session_login',
    'session_logout',
    'api_key_regenerated',
    'api_key_revealed',
    'discord_linked',
    'discord_unlinked',
    'stats_cleared'
] as const;

export type UserAuditAction = (typeof USER_AUDIT_ACTIONS)[number];

export type UserAuditLogEntry = {
    action: UserAuditAction;
    createdAt: string;
    scopes?: { stats: boolean; questions: boolean };
};

const USER_AUDIT_ACTION_SET = new Set<string>(USER_AUDIT_ACTIONS);

export function isUserAuditAction(action: string): action is UserAuditAction {
    return USER_AUDIT_ACTION_SET.has(action);
}

export function auditActionLabel(action: UserAuditAction, t: Translations): string {
    return t.settings.auditLogs.actions[action];
}

export function auditScopeDetail(
    scopes: UserAuditLogEntry['scopes'],
    t: Translations
): string {
    if (!scopes) return '';
    if (scopes.stats && scopes.questions) return t.settings.auditLogs.scopes.both;
    if (scopes.stats) return t.settings.auditLogs.scopes.stats;
    if (scopes.questions) return t.settings.auditLogs.scopes.questions;
    return '';
}

export function formatAuditRelativeTime(iso: string, t: Translations): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) return '';
    if (diffMs < 60_000) return t.settings.auditLogs.relativeTime.now;
    if (diffMs < 3_600_000) {
        return t.settings.auditLogs.relativeTime.minutes(Math.floor(diffMs / 60_000));
    }
    if (diffMs < 86_400_000) {
        return t.settings.auditLogs.relativeTime.hours(Math.floor(diffMs / 3_600_000));
    }
    if (diffMs < 7 * 86_400_000) {
        return t.settings.auditLogs.relativeTime.days(Math.floor(diffMs / 86_400_000));
    }
    return '';
}

export function formatAuditAbsoluteTime(
    iso: string,
    timeZone?: string,
    locale: Locale = 'es'
): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const bcp47 = getBcp47(locale);
    try {
        return new Intl.DateTimeFormat(bcp47, {
            timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    } catch {
        return '';
    }
}
