import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../../core/config/env';
import { logger } from '../../core/utils/logger';
import { jsonError } from '../../core/utils/jsonResponse';
import { realtimeSubjectUuid } from '../../core/utils/realtimeSubjectUuid';

import { AuthenticatedRequest } from '../../types/twitch';

/**
 * Genera un token JWT firmado para acceso a Supabase Realtime
 * Este token permite al frontend suscribirse a cambios en tiempo real
 * de forma segura, con permisos limitados y tiempo de expiración corto
 */
export const generateRealtimeToken = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const login = req.login;

    if (res.locals.isOverlayReadRequest) {
        return jsonError(res, 403, 'Los tokens de overlay no pueden acceder a Realtime.', {
            code: 'OVERLAY_READ_ONLY'
        });
    }

    if (!userId) {
        return jsonError(res, 401, 'Se requiere autenticación para generar token de realtime', {
            code: 'UNAUTHORIZED'
        });
    }

    try {
        const dbUser = res.locals.apiUser;
        if (!dbUser) {
            return jsonError(res, 401, 'Usuario no autenticado', { code: 'UNAUTHORIZED' });
        }

        // Realtime apply_rls castea auth.uid()/sub a uuid. El Twitch id NO cabe ahí:
        // sub = UUID estable; user_id = Twitch id (texto) para las políticas RLS.
        const TOKEN_TTL_S = 900; // 15 minutos
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            sub: realtimeSubjectUuid(userId),
            user_id: userId,
            login: login || dbUser.login,
            role: 'authenticated',
            aud: 'authenticated',
            iss: 'losperris-api',
            iat: now,
            exp: now + TOKEN_TTL_S
        };

        const token = jwt.sign(payload, CONFIG.SUPABASE_JWT_SECRET, {
            algorithm: 'HS256'
        });

        // Debug: no llenar los logs con una línea por cada renovación periódica
        logger.debug('Realtime token generado', { userId });

        res.json({
            token,
            expiresAt: payload.exp * 1000, // milisegundos para el frontend
            expiresIn: TOKEN_TTL_S
        });
    } catch (error) {
        logger.error('Error generando realtime token:', {
            error: (error as Error).message,
            userId,
            requestId: res.locals.requestId
        });

        return jsonError(res, 500, 'Error al generar el token de acceso', {
            code: 'INTERNAL_ERROR'
        });
    }
};
