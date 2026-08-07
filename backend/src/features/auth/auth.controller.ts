import { safeString } from '../../core/utils/validationHelpers';
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
import { notifyPanelSession } from '../../core/database/userDiscordService';

const getValidOrigin = (origin: string, req: Request): string | null => {
    try {
        const url = new URL(origin);
        const host = req.get('host');

        if (host && url.host === host) return url.origin;

        if (ALLOWED_ORIGINS.includes(url.origin)) return url.origin;
        return null;
    } catch {
        return null;
    }
};

export const login = (req: Request, res: Response) => {
    const redirectOrigin = safeString(req.query.redirect_origin) || '';
    const tz = safeString(req.query.tz) || '';

    const extraData: Record<string, unknown> = {};
    if (tz) extraData.tz = tz;

    const url = authService.getAuthorizeUrl(
        redirectOrigin,
        Object.keys(extraData).length > 0 ? extraData : undefined
    );
    res.redirect(url);
};

export const callback = async (req: Request, res: Response) => {
    const code = safeString(req.query.code);
    const state = safeString(req.query.state);

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
        const validOrigin = redirectOrigin ? getValidOrigin(redirectOrigin, req) : null;
        
        if (validOrigin) {
            redirectUrl = `${validOrigin}?${query}`;
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
                const decodedOrigin = decoded?.redirectOrigin as string;
                if (decodedOrigin) {
                    const validErrorOrigin = getValidOrigin(decodedOrigin, req);
                    if (validErrorOrigin) {
                        errorRedirect = `${validErrorOrigin}?error=auth_failed`;
                    }
                }
            } catch (_e) {
                // Ignorar errores de decodificación en el error handler
            }
        }
        res.redirect(errorRedirect);
    }
};

export const exchange = async (req: Request, res: Response) => {
    const auth = safeString(req.query.auth);

    if (!auth) {
        return jsonError(res, 400, 'Falta el token de autenticación.', { code: 'MISSING_AUTH' });
    }

    const payload = authService.verifyAuthExchange(auth);
    if (!payload) {
        return jsonError(res, 401, 'Sesión inválida o expirada.', { code: 'INVALID_AUTH' });
    }

    const consumeResult = await authService.consumeAuthExchangeToken(auth);
    if (consumeResult === 'replay') {
        return jsonError(res, 401, 'Token de sesión ya utilizado.', { code: 'AUTH_ALREADY_USED' });
    }
    if (consumeResult === 'unavailable') {
        return jsonError(res, 503, 'Servicio temporalmente no disponible. Intenta de nuevo.', {
            code: 'SERVICE_UNAVAILABLE'
        });
    }

    setSessionCookie(res, payload.userId);
    await unrevokeAuthSession(payload.userId);
    // Await: en Vercel un void tras res.json se congela y el bot nunca ve el evento.
    await notifyPanelSession(payload.userId, 'session_login');

    res.setHeader('Cache-Control', 'no-store');
    // Opción 2: no devolver apiKey al cliente; revelar vía /dashboard/reveal-api-key
    return res.json({
        userId: payload.userId,
        login: payload.login,
        displayName: payload.displayName,
        profile_image_url: payload.profile_image_url
    });
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId ?? readSessionUserId(req);
    if (userId) {
        invalidateAuthCache(userId);
        // Await antes de clear cookie / respuesta (mismo motivo que login).
        await notifyPanelSession(userId, 'session_logout');
    }
    clearSessionCookie(res);
    return res.json({ success: true });
};

/** Intercambia overlayToken firmado por sesión de solo lectura (sin API key maestra). */
export const overlayExchange = (req: Request, res: Response) => {
    const overlayToken = safeString(req.query.overlayToken);

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
        const redirectOrigin = safeString(req.query.redirect_origin) || '';
        const url = discordAuthService.getDiscordAuthorizeUrl(
            userId,
            redirectOrigin ? getValidOrigin(redirectOrigin, req) ?? undefined : undefined
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
        const { userId } = await discordAuthService.handleDiscordLinkCallback(code, state);
        setSessionCookie(res, userId);
        await unrevokeAuthSession(userId);
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
