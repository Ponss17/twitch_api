import { Request, Response } from 'express';
import * as authService from '../../services/auth/authService';
import * as dbService from '../../services/infrastructure/dbService';
import { MESSAGES } from '../../config/messages';
import { logger } from '../../utils/logger';

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
        const { user, access_token, redirectOrigin, apiKey } = await authService.handleCallback(
            code,
            state
        );

        let isAdminLogin = false;
        if (state) {
            try {
                const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
                isAdminLogin = decoded.isAdmin === true;
            } catch (_e) {
            }
        }

        if (isAdminLogin) {
            const isAuthorized = await dbService.isAdmin(user.id);
            if (!isAuthorized) {
                logger.warn(`🚫 Intento de acceso admin denegado para: ${user.login} (${user.id})`);
                return res.redirect('/api/twitch/admin/login?error=not_authorized');
            }
            return res.redirect(`/api/twitch/admin?session=${apiKey}`);
        }

        const params = `?token=${access_token}&apiKey=${apiKey}&userId=${user.id}&login=${user.login}&displayName=${encodeURIComponent(user.display_name)}`;
        const redirectUrl = redirectOrigin
            ? `${redirectOrigin}${params}`
            : `/api/twitch/dashboard${params}`;

        res.redirect(redirectUrl);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : MESSAGES.AUTH.UNKNOWN_ERROR;
        logger.error(MESSAGES.AUTH.AUTH_ERROR, { error: errorMessage });

        let errorRedirect = '/?error=auth_failed';
        if (state) {
            try {
                const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
                if (decoded.redirectOrigin)
                    errorRedirect = `${decoded.redirectOrigin}?error=auth_failed`;
            } catch (_e) {
                // ignore
            }
        }
        res.redirect(errorRedirect);
    }
};
