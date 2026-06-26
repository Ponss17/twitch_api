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
    detail?: string;
    timestamp?: string;
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

const ACTIVITY_META: Record<ActivityLogType, ActivityMeta> = {
    clip: {
        label: 'Clip',
        icon: Clapperboard,
        iconClass: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
        detailText: (item) => item.detail?.trim() || 'Nuevo clip'
    },
    followage: {
        label: 'Followage',
        icon: UserRoundCheck,
        iconClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
        detailText: (item) => (item.detail?.trim() ? `Canal: ${item.detail}` : 'Consulta de followage')
    },
    shoutout: {
        label: 'Shoutout',
        icon: Megaphone,
        iconClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        detailText: () => 'Shoutout enviado'
    },
    message: {
        label: 'Mensaje',
        icon: MessageSquare,
        iconClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        detailText: (item) => (item.detail?.trim() ? `"${item.detail}"` : 'Mensaje en chat')
    },
    russian: {
        label: 'Ruleta Rusa',
        icon: Crosshair,
        iconClass: 'text-red-400 bg-red-500/10 border-red-500/20',
        detailText: () => 'Partida de ruleta rusa'
    },
    magic8: {
        label: 'Bola 8',
        icon: CircleDot,
        iconClass: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
        detailText: (item) => item.detail?.trim() || 'Pregunta a la bola 8'
    },
    duel: {
        label: 'Duelo',
        icon: Swords,
        iconClass: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        detailText: (item) => (item.detail?.trim() ? `vs @${item.detail}` : 'Duelo iniciado')
    },
    stalker: {
        label: 'Stalker',
        icon: Binoculars,
        iconClass: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
        detailText: () => 'Escaneo de stalker'
    },
    trends: {
        label: 'Tendencias',
        icon: TrendingUp,
        iconClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        detailText: () => 'Rastreo de tendencias'
    },
    roulette: {
        label: 'Ruleta',
        icon: Dices,
        iconClass: 'text-primary bg-primary/10 border-primary/20',
        detailText: () => 'Ruleta de chatters'
    },
    other: {
        label: 'Actividad',
        icon: Activity,
        iconClass: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
        detailText: (item) => item.detail?.trim() || item.type || 'Evento registrado'
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
    return `${item.timestamp ?? ''}|${normalizeActivityType(item.type)}|${item.user ?? ''}|${item.detail ?? ''}`;
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
    return new Date(ts).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
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
