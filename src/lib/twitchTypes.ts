export interface TwitchUser {
    id: string;
    login: string;
    display_name: string;
    type?: string;
    broadcaster_type?: string;
    description?: string;
    profile_image_url?: string;
    offline_image_url?: string;
    view_count?: number;
    created_at?: string;
}

export interface StalkerUser {
    user_login: string;
    user_name: string;
    profile_image_url?: string | null;
}

export interface RouletteUser {
    user_login: string;
    user_name: string;
    mod?: boolean;
    sub?: boolean;
    vip?: boolean;
}

export function calculateAccountAge(dateStr?: string): string {
    if (!dateStr) return 'Nuevo';
    const created = new Date(dateStr);
    const now = new Date();
    const years = now.getFullYear() - created.getFullYear();
    const months = now.getMonth() - created.getMonth();
    if (years > 0) return `${years} año${years > 1 ? 's' : ''}`;
    if (months > 1) return `${months} meses`;
    return 'Nuevo';
}

export function broadcasterLabel(type?: string): string {
    if (type === 'partner') return 'Partner';
    if (type === 'affiliate') return 'Affiliate';
    return 'Usuario';
}
