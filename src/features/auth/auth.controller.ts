import { Request, Response } from 'express';
import * as authService from './auth.service';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { ALLOWED_ORIGINS } from '../../core/config/origins';

const isAllowedOrigin = (origin: string, req: Request): boolean => {
    try {
        const url = new URL(origin);
        const host = req.get('host');

        if (host && url.host === host) return true;

        return ALLOWED_ORIGINS.includes(url.origin);
    } catch {
        return false;
    }
};

export const login = (req: Request, res: Response) => {
    const redirectOrigin = (req.query.redirect_origin as string) || '';
    const tz = (req.query.tz as string) || '';

    const extraData: Record<string, unknown> = {};
    if (tz) extraData.tz = tz;

    const url = authService.getAuthorizeUrl(
        redirectOrigin,
        Object.keys(extraData).length > 0 ? extraData : undefined
    );
    res.redirect(url);
};

export const callback = async (req: Request, res: Response) => {
    const { code, state } = req.query as { code: string; state: string };

    if (!code) {
        return res.redirect('/?error=no_code');
    }

    try {
        let decodedState: Record<string, unknown> | null = null;
        if (state) {
            decodedState = authService.verifyState(state);
        }

        const { user, redirectOrigin, apiKey } = await authService.handleCallback(
            code,
            state,
            decodedState
        );

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
