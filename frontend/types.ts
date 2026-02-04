export interface TwitchUser {
    id: string;
    login: string;
    display_name: string;
    type: string;
    broadcaster_type: string;
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
    email?: string;
    created_at: string;
}

export interface Session {
    login: string;
    displayName: string;
    profile_image_url: string;
    token?: string;
    apiKey?: string;
    userId?: string;
    isNewLogin?: boolean;
    metadata?: Record<string, string | number | boolean>;
}

export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    message?: string;
    status?: number;
    valid?: boolean;
    user?: TwitchUser;
    token?: string;
}

export interface StalkerUser {
    user_login: string;
    user_name: string;
    profile_image_url: string | null;
}

export interface RouletteUser {
    user_login: string;
    user_name: string;
}

export interface ChatLogItem {
    user: string;
    text: string;
    time: Date;
}

export interface Clip {
    id: string;
    url: string;
    embed_url: string;
    broadcaster_id: string;
    broadcaster_name: string;
    creator_id: string;
    creator_name: string;
    video_id: string;
    game_id: string;
    language: string;
    title: string;
    view_count: number;
    created_at: string;
    thumbnail_url: string;
    duration: number;
    vod_offset: number;
}
export interface DashboardModule {
    init(session: Session): void | Promise<void>;
    activate?(): void | Promise<void>;
    deactivate?(): void;
    initialized?: boolean;
    isInitialized?: boolean;
    session?: Session | null;
}
