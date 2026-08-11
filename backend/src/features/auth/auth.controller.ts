import { safeString } from '../../core/utils/validationHelpers';
import { Request, Response } from 'express';
import * as authService from './auth.service';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { ALLOWED_ORIGINS } from '../../core/config/origins';
import { frontendPagePath } from '../../core/utils/frontendPaths';
import { jsonError } from '../../core/utils/jsonResponse';
import { clearSessionCookie, readSessionUserId } from '../../core/utils/sessionCookie';
import { AuthenticatedRequest } from '../../types/twitch';
import * as discordAuthService from './discordAuth.service';
import { notifyPanelSession } from '../../core/database/userDiscordService';
import {
    clearOAuthStateCookie,
    readOAuthStateCookie,
    setOAuthStateCookie
} from '../../core/utils/oauthStateCookie';
import { establishSession, revokeSessions } from '../../core/utils/sessionState';
import { invalidateUserPlanCaches } from '../../core/utils/cacheInvalidation';
import crypto from 'crypto';

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

    const state = authService.createOAuthState(
        redirectOrigin,
        Object.keys(extraData).length > 0 ? extraData : undefined
    );
    const url = authService.getAuthorizeUrl(
        redirectOrigin,
        Object.keys(extraData).length > 0 ? extraData : undefined,
        state
    );
    setOAuthStateCookie(res, state);
    res.redirect(url);
};

export const callback = async (req: Request, res: Response) => {
    const code = safeString(req.query.code);
    const state = safeString(req.query.state);

    if (!code) {
        clearOAuthStateCookie(res);
        return res.redirect(frontendPagePath('/', 'error=no_code'));
    }
    if (!state) {
        clearOAuthStateCookie(res);
        return res.redirect(frontendPagePath('/', 'error=invalid_state'));
    }

    try {
        const cookieState = readOAuthStateCookie(req);
        const decodedState = authService.verifyState(state);
        const browserStateMatches =
            cookieState !== null &&
            cookieState.length === state.length &&
            crypto.timingSafeEqual(Buffer.from(cookieState), Buffer.from(state));
        if (!decodedState || !browserStateMatches) {
            clearOAuthStateCookie(res);
            return res.redirect(frontendPagePath('/', 'error=invalid_state'));
        }

        clearOAuthStateCookie(res);
        const consumeResult = await authService.consumeOAuthState(state);
        if (consumeResult === 'replay') {
            return res.redirect(frontendPagePath('/', 'error=state_replayed'));
        }
        if (consumeResult === 'unavailable') {
            return res.redirect(frontendPagePath('/', 'error=auth_unavailable'));
        }
        const { user, redirectOrigin } = await authService.handleCallback(
            code,
            state,
            decodedState
        );

        const authToken = authService.signAuthExchange({
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
        try {
            const decoded = authService.verifyState(state);
            const decodedOrigin = decoded?.redirectOrigin as string;
            if (decodedOrigin) {
                const validErrorOrigin = getValidOrigin(decodedOrigin, req);
                if (validErrorOrigin) {
                    errorRedirect = `${validErrorOrigin}?error=auth_failed`;
                }
            }
        } catch {
            // El origen de error solo se usa si el state sigue siendo criptográficamente válido.
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

    await establishSession(res, payload.userId);
    await invalidateUserPlanCaches(payload.userId, payload.login);
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
        try {
            const login = req.login || (res.locals?.apiUser as { login?: string } | undefined)?.login;
            await revokeSessions(userId);
            await invalidateUserPlanCaches(userId, login);
            await notifyPanelSession(userId, 'session_logout');
        } catch (error) {
            logger.error('No se pudo revocar la sesión durante logout', { error });
            return jsonError(res, 503, 'No se pudo cerrar la sesión de forma segura.', {
                code: 'SERVICE_UNAVAILABLE',
                details: { reason: 'SESSION_REVOCATION_UNAVAILABLE' }
            });
        }
    }
    clearSessionCookie(res);
    return res.json({ success: true });
};

/** Intercambia overlayToken firmado por sesión de solo lectura (sin API key maestra). */
export const overlayExchange = async (req: Request, res: Response) => {
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

    if (await authService.isOverlayTokenRevoked(payload)) {
        return jsonError(res, 401, 'Enlace de overlay revocado. Genera uno nuevo desde el panel.', {
            code: 'OVERLAY_REVOKED'
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
    const code = req.query.code;
    const state = req.query.state;
    const error = req.query.error;

    if ((typeof error === 'string' && error.length > 0) || typeof code !== 'string' || typeof state !== 'string') {
        return res.redirect(frontendPagePath('/dashboard/settings', 'discord=error'));
    }

    try {
        const { userId } = await discordAuthService.handleDiscordLinkCallback(code, state);
        await establishSession(res, userId);
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
