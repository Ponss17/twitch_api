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
        const { user, redirectOrigin, apiKey, isAdmin } = await authService.handleCallback(
            code,
            state
        );

        if (isAdmin) {
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

        res.redirect(redirectUrl);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : MESSAGES.AUTH.UNKNOWN_ERROR;
        logger.error(MESSAGES.AUTH.AUTH_ERROR, { error: errorMessage });

        let errorRedirect = '/?error=auth_failed';
        if (state) {
            try {
                const decoded = authService.verifyState(state);
                if (
                    decoded?.redirectOrigin &&
                    isAllowedOrigin(decoded.redirectOrigin as string, req)
                ) {
                    errorRedirect = `${decoded.redirectOrigin}?error=auth_failed`;
                }
            } catch (_e) {
                // Ignorar errores de decodificación en el error handler
            }
        }
        res.redirect(errorRedirect);
    }
};
