import { Request, Response } from 'express';
import * as authService from './auth.service';
import * as dbService from '../../core/database/dbService';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';

import { CONFIG } from '../../core/config/env';

const isAllowedOrigin = (origin: string, req: Request): boolean => {
    try {
        const url = new URL(origin);
        const host = req.get('host');

        if (host && url.host.includes(host)) return true;

        if (url.hostname.endsWith('.vercel.app')) return true;

        try {
            const baseUrlHost = new URL(CONFIG.BASE_URL).hostname;
            if (url.hostname.includes(baseUrlHost)) return true;
        } catch {
            /* ignore */
        }

        const allowedOrigins = [
            'https://www.losperris.dev',
            'https://losperris.dev',
            'http://localhost:3000',
            'http://localhost:5173'
        ];

        return allowedOrigins.includes(url.origin);
    } catch {
        return false;
    }
};

export const login = (req: Request, res: Response) => {
    const redirectOrigin = (req.query.redirect_origin as string) || '';
    const isAdmin = req.query.admin === 'true';

    const url = authService.getAuthorizeUrl(
        redirectOrigin,
        isAdmin ? { isAdmin: true } : undefined
    );
    res.redirect(url);
};

export const callback = async (req: Request, res: Response) => {
    const { code, state } = req.query as { code: string; state: string };

    if (!code) {
        return res.redirect('/?error=no_code');
    }

    try {
        const { user, redirectOrigin, apiKey } = await authService.handleCallback(code, state);

        let isAdminLogin = false;
        if (state) {
            try {
                const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
                isAdminLogin = decoded.isAdmin === true;
            } catch (_e) {
                logger.debug('State decode failed', _e);
            }
        }

        if (isAdminLogin) {
            const isAuthorized = await dbService.isAdmin(user.id);
            if (!isAuthorized) {
                logger.warn(`🚫 Intento de acceso admin denegado para: ${user.login} (${user.id})`);
                return res.redirect('/api/twitch/admin/login?error=not_authorized');
            }
            return res.redirect(`/api/twitch/admin-dashboard?session=${apiKey}`);
        }

        const params = `?apiKey=${apiKey}&userId=${user.id}&login=${user.login}&displayName=${encodeURIComponent(user.display_name)}`;

        let redirectUrl = `/api/twitch/dashboard${params}`;
        if (redirectOrigin && isAllowedOrigin(redirectOrigin, req)) {
            redirectUrl = `${redirectOrigin}${params}`;
        }

        // Registrar actividad de inicio de sesión de forma asíncrona pero esperada
        try {
            await dbService.addUserActivity(user.id, {
                type: 'other',
                user: user.display_name,
                detail: 'Sesión iniciada'
            });
        } catch (e) {
            logger.error('Error logging login activity:', e);
        }

        res.redirect(redirectUrl);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : MESSAGES.AUTH.UNKNOWN_ERROR;
        logger.error(MESSAGES.AUTH.AUTH_ERROR, { error: errorMessage });

        let errorRedirect = '/?error=auth_failed';
        if (state) {
            try {
                const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
                if (decoded.redirectOrigin && isAllowedOrigin(decoded.redirectOrigin, req))
                    errorRedirect = `${decoded.redirectOrigin}?error=auth_failed`;
            } catch (_e) {
                // Ignore state decode errors in error handler
            }
        }
        res.redirect(errorRedirect);
    }
};
