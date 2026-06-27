import { Request } from 'express';

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

export interface TwitchClip {
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
    vod_offset: number | null;
}

export interface StoredUser {
    userId: string;
    login: string;
    displayName: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    obtainedAt: number;
    apiKey?: string;
    isActive?: boolean;
    blockedReason?: string;
    customRateLimit?: number;
    // Analíticas
    totalRequests?: number;
    stats?: Record<string, number>;
    lastActive?: string;
    createdAt?: string;
    profileImageUrl?: string;
    timezone?: string;
    /** Epoch ms — persistido en Supabase como token_expires_at */
    tokenExpiresAt?: number;
}

export interface AuthenticatedRequest extends Request {
    twitchToken?: string;
    userId?: string;
    login?: string;
    displayName?: string;
}

export interface TwitchValidationResponse {
    client_id: string;
    login: string;
    scopes: string[];
    user_id: string;
    expires_in: number;
}

export interface TwitchChannelInfo {
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    content_classification_labels: string[];
    delay: number;
    game_id: string;
    game_name: string;
    is_mature: boolean;
    language: string;
    title: string;
}
