import { Response } from 'express';
import * as authService from '../auth/auth.service';
import * as dbService from '../../core/database/dbService';
import * as apiService from '../twitch/twitch.service';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { jsonError } from '../../core/utils/jsonResponse';
import { establishSession } from '../../core/utils/sessionState';
import { isAuthenticationError } from '../../core/errors/AppError';

import { AuthenticatedRequest } from '../../types/twitch';

/** Respuesta de validate al panel: sin secretos; renovación usa tokenExpiresAt + cookie. */
function panelValidatePayload(params: {
    userId: string;
    login?: string;
    displayName?: string;
    profileImageUrl?: string;
    timezone?: string;
    tokenExpiresAt?: number | null;
}) {
    return {
        valid: true as const,
        tokenExpiresAt: params.tokenExpiresAt && params.tokenExpiresAt > 0 ? params.tokenExpiresAt : null,
        user: {
            id: params.userId,
            login: params.login,
            display_name: params.displayName || params.login,
            profile_image_url: params.profileImageUrl,
            timezone: params.timezone || 'UTC'
        }
    };
}

export const validateToken = async (req: AuthenticatedRequest, res: Response) => {
    try {
        let token = req.twitchToken;
        const apiUser = res.locals.apiUser as { apiKey?: string } | undefined;

        // Con API Key: refrescar token antes de validar (el caché puede tener accessToken caducado).
        if (res.locals.isApiKeyRequest && apiUser?.apiKey) {
            try {
                const auth = await authService.getValidToken(apiUser.apiKey);
                token = auth.accessToken;
                req.userId = auth.userId;
                req.twitchToken = token;
            } catch (err) {
                const isAuthError = isAuthenticationError(err);
                
                logger.warn('validateToken: no se pudo obtener token con API Key', (err as Error).message);
                if (isAuthError) {
                    return jsonError(res, 401, MESSAGES.AUTH.INVALID_TOKEN);
                }
                return jsonError(res, 503, 'Red inestable validando API Key.', {
                    code: 'SERVICE_UNAVAILABLE',
                    details: { offline: true }
                });
            }
        }

        // Si el middleware checkToken ya identificó al usuario (usando caché global), retornar rápido
        if (apiUser && typeof apiUser === 'object' && 'userId' in apiUser) {
            if (res.locals.isOverlayReadRequest) {
                return jsonError(res, 403, 'Los tokens de overlay no pueden validar sesión.', {
                    code: 'OVERLAY_READ_ONLY'
                });
            }

            const user = apiUser as {
                userId: string;
                apiKey?: string;
                login?: string;
                displayName?: string;
                profileImageUrl?: string;
                timezone?: string;
                tokenExpiresAt?: number;
            };
            if (!res.locals.isCookieSession) {
                await establishSession(res, user.userId);
            }
            // tokenExpiresAt fresco (post-renew del middleware) para useProactiveTokenRefresh
            let tokenExpiresAt =
                user.tokenExpiresAt && user.tokenExpiresAt > 0 ? user.tokenExpiresAt : null;
            // Si el objeto en memoria quedó stale, leer DB (p. ej. renew en otra petición).
            if (!tokenExpiresAt || tokenExpiresAt < Date.now() + 30 * 60 * 1000) {
                const fresh = await dbService.getUser(user.userId);
                if (fresh?.tokenExpiresAt && fresh.tokenExpiresAt > 0) {
                    tokenExpiresAt = fresh.tokenExpiresAt;
                }
            }
            return res.json(
                panelValidatePayload({
                    userId: user.userId,
                    login: user.login,
                    displayName: user.displayName,
                    profileImageUrl: user.profileImageUrl,
                    timezone: user.timezone,
                    tokenExpiresAt
                })
            );
        }

        if (!token) {
            return jsonError(res, 401, MESSAGES.AUTH.NO_TOKEN);
        }

        const validation = await apiService.validateToken(token);
        if (!validation) {
            return jsonError(res, 401, MESSAGES.AUTH.INVALID_TOKEN);
        }

        try {
            const [userProfile, dbUser] = await Promise.all([
                apiService.getUserInfo(validation.login, token),
                dbService.getUser(validation.user_id)
            ]);

            const tokenExpiresAt =
                dbUser?.tokenExpiresAt && dbUser.tokenExpiresAt > 0 ? dbUser.tokenExpiresAt : null;
            if (validation.user_id) {
                if (!res.locals.isCookieSession) {
                    await establishSession(res, validation.user_id);
                }
            }
            return res.json(
                panelValidatePayload({
                    userId: userProfile.id,
                    login: userProfile.login,
                    displayName: userProfile.display_name,
                    profileImageUrl: userProfile.profile_image_url,
                    timezone: dbUser?.timezone,
                    tokenExpiresAt
                })
            );
        } catch (err) {
            logger.error('Error fetching supplementary user info:', err);
            return jsonError(res, 503, 'No se pudo cargar el perfil completo. Intenta de nuevo.', {
                code: 'SERVICE_UNAVAILABLE'
            });
        }
    } catch (error) {
        logger.error('validateToken unexpected error:', error);
        return jsonError(res, 503, MESSAGES.AUTH.VALIDATION_ERROR, {
            code: 'SERVICE_UNAVAILABLE',
            details: { offline: true }
        });
    }
};
