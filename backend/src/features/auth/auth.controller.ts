import { Request, Response } from 'express';
import * as authService from './auth.service';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { ALLOWED_ORIGINS } from '../../core/config/origins';
import { frontendPagePath } from '../../core/utils/frontendPaths';
import { jsonError } from '../../core/utils/jsonResponse';
import { setSessionCookie, clearSessionCookie, readSessionUserId } from '../../core/utils/sessionCookie';
import { invalidateAuthCache, unrevokeAuthSession } from '../../core/middleware/authMiddleware';
import { AuthenticatedRequest } from '../../types/twitch';
import * as discordAuthService from './discordAuth.service';

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
        return res.redirect(frontendPagePath('/', 'error=no_code'));
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

        const authToken = authService.signAuthExchange({
            apiKey,
            userId: user.id,
            login: user.login,
            displayName: user.display_name,
            profile_image_url: user.profile_image_url
        });

        const query = `auth=${encodeURIComponent(authToken)}`;

        let redirectUrl: string;
        if (redirectOrigin && isAllowedOrigin(redirectOrigin, req)) {
            redirectUrl = `${redirectOrigin}?${query}`;
        } else {
            redirectUrl = frontendPagePath('/dashboard/', query);
        }

        res.redirect(redirectUrl);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : MESSAGES.AUTH.UNKNOWN_ERROR;
        logger.error(MESSAGES.AUTH.AUTH_ERROR, { error: errorMessage });

        let errorRedirect = frontendPagePath('/', 'error=auth_failed');
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

export const exchange = async (req: Request, res: Response) => {
    const auth = req.query.auth as string;

    if (!auth) {
        return jsonError(res, 400, 'Falta el token de autenticación.', { code: 'MISSING_AUTH' });
    }

    const payload = authService.verifyAuthExchange(auth);
    if (!payload) {
        return jsonError(res, 401, 'Sesión inválida o expirada.', { code: 'INVALID_AUTH' });
    }

    const consumed = await authService.consumeAuthExchangeToken(auth);
    if (!consumed) {
        return jsonError(res, 401, 'Token de sesión ya utilizado.', { code: 'AUTH_ALREADY_USED' });
    }

    setSessionCookie(res, payload.userId);
    await unrevokeAuthSession(payload.userId);

    res.setHeader('Cache-Control', 'no-store');
    // Opción 2: no devolver apiKey al cliente; revelar vía /dashboard/reveal-api-key
    return res.json({
        userId: payload.userId,
        login: payload.login,
        displayName: payload.displayName,
        profile_image_url: payload.profile_image_url
    });
};

export const logout = (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId ?? readSessionUserId(req);
    if (userId) {
        invalidateAuthCache(userId);
    }
    clearSessionCookie(res);
    return res.json({ success: true });
};

/** Intercambia overlayToken firmado por sesión de solo lectura (sin API key maestra). */
export const overlayExchange = (req: Request, res: Response) => {
    const overlayToken = req.query.overlayToken as string;

    if (!overlayToken) {
        return jsonError(res, 400, 'Falta el token del overlay.', { code: 'MISSING_OVERLAY_TOKEN' });
    }

    const payload = authService.verifyOverlayReadToken(overlayToken);
    if (!payload) {
        return jsonError(res, 401, 'Enlace de overlay inválido o expirado.', {
            code: 'INVALID_OVERLAY_TOKEN'
        });
    }

    return res.json({
        valid: true,
        overlayToken,
        userId: payload.userId,
        login: payload.login,
        displayName: payload.displayName,
        profile_image_url: payload.profile_image_url,
        tool: payload.tool
    });
};

export const discordLinkStart = (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId ?? readSessionUserId(req);
    if (!userId) {
        return res.redirect(frontendPagePath('/dashboard/settings', 'discord=error_auth'));
    }

    try {
        const redirectOrigin = (req.query.redirect_origin as string) || '';
        const url = discordAuthService.getDiscordAuthorizeUrl(
            userId,
            redirectOrigin && isAllowedOrigin(redirectOrigin, req) ? redirectOrigin : undefined
        );
        return res.redirect(url);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'DISCORD_OAUTH_NOT_CONFIGURED') {
            return res.redirect(frontendPagePath('/dashboard/settings', 'discord=error_config'));
        }
        logger.error('Discord link start failed', { error: msg });
        return res.redirect(frontendPagePath('/dashboard/settings', 'discord=error'));
    }
};

export const discordLinkCallback = async (req: Request, res: Response) => {
    const { code, state, error } = req.query as {
        code?: string;
        state?: string;
        error?: string;
    };

    if (error || !code || !state) {
        return res.redirect(frontendPagePath('/dashboard/settings', 'discord=error'));
    }

    try {
        await discordAuthService.handleDiscordLinkCallback(code, state);
        return res.redirect(frontendPagePath('/dashboard/settings', 'discord=linked'));
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        logger.error('Discord link callback failed', { error: msg });

        if (msg === 'DISCORD_ALREADY_LINKED') {
            return res.redirect(frontendPagePath('/dashboard/settings', 'discord=error_taken'));
        }
        if (msg === 'INVALID_STATE' || msg === 'DISCORD_OAUTH_NOT_CONFIGURED') {
            return res.redirect(
                frontendPagePath(
                    '/dashboard/settings',
                    msg === 'DISCORD_OAUTH_NOT_CONFIGURED' ? 'discord=error_config' : 'discord=error'
                )
            );
        }
        return res.redirect(frontendPagePath('/dashboard/settings', 'discord=error'));
    }
};

export const discordUnlink = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId ?? readSessionUserId(req);
    if (!userId) {
        return jsonError(res, 401, 'Debes iniciar sesión.', { code: 'UNAUTHORIZED' });
    }

    try {
        await discordAuthService.unlinkDiscord(userId);
        return res.json({ success: true });
    } catch (error: unknown) {
        logger.error('Discord unlink failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        return jsonError(res, 500, 'No se pudo desvincular Discord.', { code: 'INTERNAL_ERROR' });
    }
};
