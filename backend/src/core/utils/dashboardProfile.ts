import type { TwitchUser } from '../../types/twitch';

export type DashboardProfile = {
    id: string;
    login: string;
    display_name: string;
    broadcaster_type?: string;
    description?: string;
    profile_image_url?: string;
    created_at?: string;
    view_count?: number;
    followers: number;
    views?: number;
    rateLimit?: number;
};

export function buildDashboardProfile(
    info: TwitchUser,
    followers: number,
    rateLimit?: number
): DashboardProfile {
    return {
        id: info.id,
        login: info.login,
        display_name: info.display_name,
        broadcaster_type: info.broadcaster_type,
        description: info.description,
        profile_image_url: info.profile_image_url,
        created_at: info.created_at,
        view_count: info.view_count,
        followers,
        views: info.view_count,
        ...(rateLimit !== undefined ? { rateLimit } : {})
    };
}
