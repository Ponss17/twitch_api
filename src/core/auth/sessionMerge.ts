import type { ApiResponse, Session } from '@/core/config/config';
import { getSession, saveSession } from './sessionStorage';

function pickSessionFromValidate(result: ApiResponse): Partial<Session> {
    const partial: Partial<Session> = {};
    if (typeof result.apiKey === 'string' && result.apiKey) {
        partial.apiKey = result.apiKey;
    }
    if (typeof result.token === 'string' && result.token) {
        partial.token = result.token;
    }
    if (typeof result.overlayToken === 'string' && result.overlayToken) {
        partial.overlayToken = result.overlayToken;
    }
    if (typeof result.login === 'string' && result.login) {
        partial.login = result.login;
    }
    if (typeof result.displayName === 'string' && result.displayName) {
        partial.displayName = result.displayName;
    }
    if (typeof result.userId === 'string' && result.userId) {
        partial.userId = result.userId;
    }
    if (typeof result.profile_image_url === 'string' && result.profile_image_url) {
        partial.profile_image_url = result.profile_image_url;
    }
    if (typeof result.tokenExpiresAt === 'number' && result.tokenExpiresAt > 0) {
        partial.tokenExpiresAt = result.tokenExpiresAt;
    }
    const user = result.user;
    if (user && typeof user === 'object') {
        const profile = user as Record<string, unknown>;
        if (typeof profile.login === 'string') partial.login = profile.login;
        if (typeof profile.display_name === 'string') partial.displayName = profile.display_name;
        if (typeof profile.profile_image_url === 'string') {
            partial.profile_image_url = profile.profile_image_url;
        }
        if (typeof profile.id === 'string') partial.userId = profile.id;
    }
    return partial;
}

export function mergeSessionFromValidate(
    session: Session,
    result: ApiResponse,
    options?: { persist?: boolean }
): Session {
    const merged: Session = { ...session, ...pickSessionFromValidate(result) };
    if (options?.persist !== false) {
        saveSession(merged);
    }
    return merged;
}

export function mergeSessionFieldsFromValidate(session: Session, result: ApiResponse): Session {
    return { ...session, ...pickSessionFromValidate(result) };
}

export function resolveDegradedSession(session: Session): Session {
    const stored = getSession();
    return stored ? { ...stored, ...session } : session;
}
