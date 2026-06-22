export interface ActivityLogItem {
    action?: string;
    type?: string;
    user?: string;
    timestamp?: string;
}

const EMOJI_PREFIX = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\s]+/u;

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

export function parseActivityLogParts(item: ActivityLogItem): { user: string; message: string } {
    let user = item.user?.trim() || '';
    if (/^\d{5,}$/.test(user)) {
        user = '';
    }
    let message = (item.action || item.type || 'Actividad').trim();

    if (user) {
        const escaped = user.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        message = message.replace(new RegExp(`@${escaped}`, 'gi'), '').trim();
    } else {
        const mention = message.match(/@([\w\d_]+)/);
        if (mention) {
            return parseActivityLogParts({ ...item, user: mention[1], action: message });
        }
    }

    message = message.replace(EMOJI_PREFIX, '').trim();

    return { user, message: message || 'Actividad registrada' };
}
