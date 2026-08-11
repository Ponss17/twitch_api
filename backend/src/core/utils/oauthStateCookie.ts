import { Request, Response } from 'express';

export const OAUTH_STATE_COOKIE_NAME = 'lp_oauth_state';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const options = {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const
};

export function setOAuthStateCookie(res: Response, state: string): void {
    res.cookie(OAUTH_STATE_COOKIE_NAME, state, {
        ...options,
        maxAge: OAUTH_STATE_TTL_MS
    });
}

export function clearOAuthStateCookie(res: Response): void {
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, {
        ...options,
        maxAge: 0
    });
}

export function readOAuthStateCookie(req: Request): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    for (const part of cookieHeader.split(';')) {
        const [name, ...value] = part.trim().split('=');
        if (name === OAUTH_STATE_COOKIE_NAME && value.length > 0) {
            return decodeURIComponent(value.join('='));
        }
    }
    return null;
}
