import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    Binoculars,
    Clapperboard,
    Crosshair,
    CircleDot,
    Dices,
    Megaphone,
    MessageSquare,
    Swords,
    TrendingUp,
    UserRoundCheck
} from 'lucide-react';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import type {
    ActivityLogType,
    DashboardActivityLog
} from '@contracts/dashboardContracts';
import type { Translations } from '@/core/i18n/locales/es';
import { getBcp47, type Locale } from '@/core/i18n/I18nContext';

export type { ActivityLogType } from '@contracts/dashboardContracts';

/** Consumidor UI — campos opcionales por tolerancia a payloads parciales. */
export type ActivityLogItem = Partial<DashboardActivityLog>;

/** Safely reads a string field from metadata (unknown values). */
function metaStr(meta: Record<string, unknown> | undefined, key: string): string {
    const val = meta?.[key];
    return typeof val === 'string' ? val.trim() : '';
}

const KNOWN_TYPES: ActivityLogType[] = [
    'clip',
    'followage',
    'shoutout',
    'message',
    'russian',
    'magic8',
    'duel',
    'stalker',
    'trends',
    'roulette',
    'other'
];

export interface ActivityMeta {
    label: string;
    icon: LucideIcon;
    iconClass: string;
    detailText: (item: ActivityLogItem) => string;
}

const ACTIVITY_ICON_CLASS = subtleIcon('primary');

function getActivityMetaDict(t: Translations): Record<ActivityLogType, Omit<ActivityMeta, 'iconClass'>> {
    const act = t.home.activityLog.types;
    return {
        clip: {
            label: act.clip.label,
            icon: Clapperboard,
            detailText: (item) => metaStr(item.metadata, 'title') || metaStr(item.metadata, 'raw_detail') || act.clip.defaultDetail
        },
        followage: {
            label: act.followage.label,
            icon: UserRoundCheck,
            detailText: (item) => {
                const target = metaStr(item.metadata, 'target') || metaStr(item.metadata, 'raw_detail');
                return target ? act.followage.channel(target) : act.followage.defaultDetail;
            }
        },
        shoutout: {
            label: act.shoutout.label,
            icon: Megaphone,
            detailText: (item) => {
                const target = metaStr(item.metadata, 'target') || metaStr(item.metadata, 'raw_detail');
                return target ? act.shoutout.to(target) : act.shoutout.defaultDetail;
            }
        },
        message: {
            label: act.message.label,
            icon: MessageSquare,
            detailText: (item) => {
                const msg = metaStr(item.metadata, 'message') || metaStr(item.metadata, 'raw_detail');
                return msg ? `"${msg}"` : act.message.defaultDetail;
            }
        },
        russian: {
            label: act.russian.label,
            icon: Crosshair,
            detailText: (item) => {
                const target = metaStr(item.metadata, 'target') || metaStr(item.metadata, 'raw_detail');
                return target ? act.russian.channel(target) : act.russian.defaultDetail;
            }
        },
        magic8: {
            label: act.magic8.label,
            icon: CircleDot,
            detailText: (item) => metaStr(item.metadata, 'question') || metaStr(item.metadata, 'raw_detail') || act.magic8.defaultDetail
        },
        duel: {
            label: act.duel.label,
            icon: Swords,
            detailText: (item) => {
                const target = metaStr(item.metadata, 'target') || metaStr(item.metadata, 'raw_detail');
                return target ? act.duel.vs(target) : act.duel.defaultDetail;
            }
        },
        stalker: {
            label: act.stalker.label,
            icon: Binoculars,
            detailText: () => act.stalker.defaultDetail
        },
        trends: {
            label: act.trends.label,
            icon: TrendingUp,
            detailText: () => act.trends.defaultDetail
        },
        roulette: {
            label: act.roulette.label,
            icon: Dices,
            detailText: () => act.roulette.defaultDetail
        },
        other: {
            label: act.other.label,
            icon: Activity,
            detailText: (item) => metaStr(item.metadata, 'raw_detail') || item.type || act.other.defaultDetail
        }
    };
}

export function normalizeActivityType(type?: string): ActivityLogType {
    if (type && (KNOWN_TYPES as string[]).includes(type)) {
        return type as ActivityLogType;
    }
    return 'other';
}

export function getActivityMeta(type: string | undefined, t: Translations): ActivityMeta {
    const meta = getActivityMetaDict(t)[normalizeActivityType(type)];
    return {
        ...meta,
        iconClass: ACTIVITY_ICON_CLASS
    };
}

export function sanitizeActivityUser(user?: string): string {
    const trimmed = user?.trim() || '';
    if (/^\d{5,}$/.test(trimmed)) return '';
    return trimmed;
}

export function activityEntryKey(item: ActivityLogItem): string {
    return `${item.timestamp ?? ''}|${normalizeActivityType(item.type)}|${item.user ?? ''}|${JSON.stringify(item.metadata)}`;
}

function activityDateLabel(date: Date, timeZone: string | undefined, locale: Locale): string {
    const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const bcp47 = getBcp47(locale);
    return new Intl.DateTimeFormat(bcp47, {
        timeZone: tz,
        day: 'numeric',
        month: 'long'
    }).format(date);
}

export function formatActivityDate(ts: string, timeZone: string | undefined, locale: Locale, t: Translations): string {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';

    const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = activityDateLabel(new Date(), tz, locale);
    const yesterday = activityDateLabel(new Date(Date.now() - 86_400_000), tz, locale);
    const label = activityDateLabel(d, tz, locale);
    if (label === today) return t.home.activityLog.date.today;
    if (label === yesterday) return t.home.activityLog.date.yesterday;
    return label;
}

export function formatActivityTime(ts: string, timeZone?: string, locale: Locale = 'en'): string {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return '';
    
    const bcp47 = getBcp47(locale);

    const parts = new Intl.DateTimeFormat(bcp47, {
        timeZone: timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).formatToParts(date);

    const hour = parts.find((p) => p.type === 'hour')?.value ?? '12';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
    const rawPeriod = (parts.find((p) => p.type === 'dayPeriod')?.value ?? 'am').toLowerCase();
    const period = rawPeriod.includes('p') ? 'pm' : 'am';

    return `${hour}:${minute} ${period}`;
}

export function formatActivityRelativeTime(ts: string, t: Translations): string {
    const diffMs = Date.now() - new Date(ts).getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) return '';
    if (diffMs < 60_000) return t.home.activityLog.relativeTime.now;
    if (diffMs < 3_600_000) {
        const mins = Math.floor(diffMs / 60_000);
        return t.home.activityLog.relativeTime.minutes(mins);
    }
    if (diffMs < 86_400_000) {
        const hours = Math.floor(diffMs / 3_600_000);
        return t.home.activityLog.relativeTime.hours(hours);
    }
    return '';
}
