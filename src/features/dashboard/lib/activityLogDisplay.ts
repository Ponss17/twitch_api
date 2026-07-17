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

const ACTIVITY_META: Record<ActivityLogType, Omit<ActivityMeta, 'iconClass'>> = {
    clip: {
        label: 'Clip',
        icon: Clapperboard,
        detailText: (item) => metaStr(item.metadata, 'title') || metaStr(item.metadata, 'raw_detail') || 'Nuevo clip'
    },
    followage: {
        label: 'Followage',
        icon: UserRoundCheck,
        detailText: (item) => {
            const target = metaStr(item.metadata, 'target') || metaStr(item.metadata, 'raw_detail');
            return target ? `Canal: ${target}` : 'Consulta de followage';
        }
    },
    shoutout: {
        label: 'Shoutout',
        icon: Megaphone,
        detailText: (item) => {
            const target = metaStr(item.metadata, 'target') || metaStr(item.metadata, 'raw_detail');
            return target ? `A: ${target}` : 'Shoutout enviado';
        }
    },
    message: {
        label: 'Mensaje',
        icon: MessageSquare,
        detailText: (item) => {
            const msg = metaStr(item.metadata, 'message') || metaStr(item.metadata, 'raw_detail');
            return msg ? `"${msg}"` : 'Mensaje en chat';
        }
    },
    russian: {
        label: 'Ruleta Rusa',
        icon: Crosshair,
        detailText: (item) => {
            const target = metaStr(item.metadata, 'target') || metaStr(item.metadata, 'raw_detail');
            return target ? `Canal: ${target}` : 'Partida de ruleta rusa';
        }
    },
    magic8: {
        label: 'Bola 8',
        icon: CircleDot,
        detailText: (item) => metaStr(item.metadata, 'question') || metaStr(item.metadata, 'raw_detail') || 'Pregunta a la bola 8'
    },
    duel: {
        label: 'Duelo',
        icon: Swords,
        detailText: (item) => {
            const target = metaStr(item.metadata, 'target') || metaStr(item.metadata, 'raw_detail');
            return target ? `vs @${target}` : 'Duelo iniciado';
        }
    },
    stalker: {
        label: 'Stalker',
        icon: Binoculars,
        detailText: () => 'Escaneo de stalker'
    },
    trends: {
        label: 'Tendencias',
        icon: TrendingUp,
        detailText: () => 'Rastreo de tendencias'
    },
    roulette: {
        label: 'Ruleta',
        icon: Dices,
        detailText: () => 'Ruleta de chatters'
    },
    other: {
        label: 'Actividad',
        icon: Activity,
        detailText: (item) => metaStr(item.metadata, 'raw_detail') || item.type || 'Evento registrado'
    }
};

export function normalizeActivityType(type?: string): ActivityLogType {
    if (type && (KNOWN_TYPES as string[]).includes(type)) {
        return type as ActivityLogType;
    }
    return 'other';
}

export function getActivityMeta(type?: string): ActivityMeta {
    const meta = ACTIVITY_META[normalizeActivityType(type)];
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

function activityDateLabel(date: Date, timeZone?: string): string {
    const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Intl.DateTimeFormat('es-ES', {
        timeZone: tz,
        day: 'numeric',
        month: 'long'
    }).format(date);
}

export function formatActivityDate(ts: string, timeZone?: string): string {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';

    const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = activityDateLabel(new Date(), tz);
    const yesterday = activityDateLabel(new Date(Date.now() - 86_400_000), tz);
    const label = activityDateLabel(d, tz);
    if (label === today) return 'Hoy';
    if (label === yesterday) return 'Ayer';
    return label;
}

export function formatActivityTime(ts: string, timeZone?: string): string {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).formatToParts(date);

    const hour = parts.find((p) => p.type === 'hour')?.value ?? '12';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
    const period = (parts.find((p) => p.type === 'dayPeriod')?.value ?? 'am').toLowerCase();

    return `${hour}:${minute} ${period}`;
}

export function formatActivityRelativeTime(ts: string): string {
    const diffMs = Date.now() - new Date(ts).getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) return '';
    if (diffMs < 60_000) return 'ahora';
    if (diffMs < 3_600_000) {
        const mins = Math.floor(diffMs / 60_000);
        return `hace ${mins} min`;
    }
    if (diffMs < 86_400_000) {
        const hours = Math.floor(diffMs / 3_600_000);
        return `hace ${hours} h`;
    }
    return '';
}
