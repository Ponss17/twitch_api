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

export type ActivityLogType =
    | 'clip'
    | 'followage'
    | 'shoutout'
    | 'message'
    | 'russian'
    | 'magic8'
    | 'duel'
    | 'stalker'
    | 'trends'
    | 'roulette'
    | 'other';

export interface ActivityLogItem {
    type?: string;
    user?: string;
    metadata?: Record<string, unknown>;
    timestamp?: string;
}

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

const ACTIVITY_ICON_CLASS = 'text-primary bg-primary/10 border-primary/20';

const ACTIVITY_META: Record<ActivityLogType, ActivityMeta> = {
    clip: {
        label: 'Clip',
        icon: Clapperboard,
        iconClass: ACTIVITY_ICON_CLASS,
        detailText: (item) => metaStr(item.metadata, 'title') || metaStr(item.metadata, 'raw_detail') || 'Nuevo clip'
    },
    followage: {
        label: 'Followage',
        icon: UserRoundCheck,
        iconClass: ACTIVITY_ICON_CLASS,
        detailText: (item) => {
            const target = metaStr(item.metadata, 'target') || metaStr(item.metadata, 'raw_detail');
            return target ? `Canal: ${target}` : 'Consulta de followage';
        }
    },
    shoutout: {
        label: 'Shoutout',
        icon: Megaphone,
        iconClass: ACTIVITY_ICON_CLASS,
        detailText: (item) => {
            const target = metaStr(item.metadata, 'target') || metaStr(item.metadata, 'raw_detail');
            return target ? `A: ${target}` : 'Shoutout enviado';
        }
    },
    message: {
        label: 'Mensaje',
        icon: MessageSquare,
        iconClass: ACTIVITY_ICON_CLASS,
        detailText: (item) => {
            const msg = metaStr(item.metadata, 'message') || metaStr(item.metadata, 'raw_detail');
            return msg ? `"${msg}"` : 'Mensaje en chat';
        }
    },
    russian: {
        label: 'Ruleta Rusa',
        icon: Crosshair,
        iconClass: ACTIVITY_ICON_CLASS,
        detailText: (item) => {
            const target = metaStr(item.metadata, 'target') || metaStr(item.metadata, 'raw_detail');
            return target ? `Canal: ${target}` : 'Partida de ruleta rusa';
        }
    },
    magic8: {
        label: 'Bola 8',
        icon: CircleDot,
        iconClass: ACTIVITY_ICON_CLASS,
        detailText: (item) => metaStr(item.metadata, 'question') || metaStr(item.metadata, 'raw_detail') || 'Pregunta a la bola 8'
    },
    duel: {
        label: 'Duelo',
        icon: Swords,
        iconClass: ACTIVITY_ICON_CLASS,
        detailText: (item) => {
            const target = metaStr(item.metadata, 'target') || metaStr(item.metadata, 'raw_detail');
            return target ? `vs @${target}` : 'Duelo iniciado';
        }
    },
    stalker: {
        label: 'Stalker',
        icon: Binoculars,
        iconClass: ACTIVITY_ICON_CLASS,
        detailText: () => 'Escaneo de stalker'
    },
    trends: {
        label: 'Tendencias',
        icon: TrendingUp,
        iconClass: ACTIVITY_ICON_CLASS,
        detailText: () => 'Rastreo de tendencias'
    },
    roulette: {
        label: 'Ruleta',
        icon: Dices,
        iconClass: ACTIVITY_ICON_CLASS,
        detailText: () => 'Ruleta de chatters'
    },
    other: {
        label: 'Actividad',
        icon: Activity,
        iconClass: ACTIVITY_ICON_CLASS,
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
    return ACTIVITY_META[normalizeActivityType(type)];
}

export function sanitizeActivityUser(user?: string): string {
    const trimmed = user?.trim() || '';
    if (/^\d{5,}$/.test(trimmed)) return '';
    return trimmed;
}

export function activityEntryKey(item: ActivityLogItem): string {
    return `${item.timestamp ?? ''}|${normalizeActivityType(item.type)}|${item.user ?? ''}|${JSON.stringify(item.metadata)}`;
}

export function formatActivityDate(ts: string): string {
    const d = new Date(ts);
    const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long'
    });
    const label = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    if (label === today) return 'Hoy';
    if (label === yesterday) return 'Ayer';
    return label;
}

export function formatActivityTime(ts: string): string {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return '';

    const hours12 = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = date.getHours() >= 12 ? 'pm' : 'am';

    return `${hours12}:${minutes} ${period}`;
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
