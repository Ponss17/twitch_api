import { Response } from 'express';
import * as cacheService from '../../../core/database/cacheService';
import { CACHE_TTL_MATRIX } from '../../../core/config/cacheTtl';
import { MESSAGES } from '../../../core/config/messages';
import { isPanelBrowserRequest } from '../../../core/config/origins';
import { logger } from '../../../core/utils/logger';
import { AuthenticatedRequest } from '../../../types/twitch';
import { jsonError } from '../../../core/utils/jsonResponse';
import { frontendPagePath } from '../../../core/utils/frontendPaths';
import { signOverlayReadToken } from '../../auth/auth.service';
import { overlayPagePath, overlayStateKey } from './keys';

function overlayToolMismatch(res: Response, requestedTool: string): boolean {
    const tokenTool = res.locals?.overlayTool as string | undefined;
    if (!res.locals?.isOverlayReadRequest || !tokenTool) return false;
    if (tokenTool === requestedTool) return false;
    jsonError(res, 403, 'El token de overlay no corresponde a esta herramienta.', {
        code: 'FORBIDDEN'
    });
    return true;
}

export const getOverlayState = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const tool = req.params.tool as string;

    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);
    if (overlayToolMismatch(res, tool)) return;

    try {
        const cached = await cacheService.get<Record<string, unknown>>(overlayStateKey(userId, tool));
        if (!cached) {
            res.setHeader('Cache-Control', 'no-store');
            return res.json({ state: null });
        }
        res.setHeader('Cache-Control', 'no-store');
        return res.json({ state: cached });
    } catch (e) {
        logger.error('Error getting overlay state:', e);
        return jsonError(res, 500, 'Error al leer el estado del overlay.');
    }
};

export const putOverlayState = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const tool = req.params.tool as string;
    const { state } = req.body as { state: Record<string, unknown> };

    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);
    if (overlayToolMismatch(res, tool)) return;

    if (res.locals?.isOverlayReadRequest) {
        return jsonError(res, 403, 'Solo el panel puede publicar el estado del overlay.', {
            code: 'FORBIDDEN'
        });
    }

    // API key desde bots (sin Origin) no puede publicar; el panel sí (navegador con Origin válido).
    if (
        res.locals?.isApiKeyRequest &&
        !isPanelBrowserRequest(
            (req.headers?.origin as string) || '',
            (req.headers?.referer as string) || ''
        )
    ) {
        return jsonError(res, 403, 'Solo el panel puede publicar el estado del overlay.', {
            code: 'FORBIDDEN'
        });
    }

    try {
        const payload = { ...state, updatedAt: Date.now() };
        const key = overlayStateKey(userId, tool);
        await cacheService.set(key, payload, CACHE_TTL_MATRIX.OVERLAY_STATE.default);
        return res.json({ success: true });
    } catch (e) {
        logger.error('Error saving overlay state:', e);
        return jsonError(res, 500, 'Error al guardar el estado del overlay.');
    }
};

export const createOverlayLink = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const { tool } = req.body as { tool: 'roulette' | 'trends' };

    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const apiUser = res.locals.apiUser as
        | { apiKey?: string; login?: string; displayName?: string; profileImageUrl?: string }
        | undefined;

    if (!apiUser?.apiKey) {
        return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);
    }

    try {
        const overlayToken = signOverlayReadToken({
            userId,
            tool,
            login: apiUser.login || req.login || '',
            displayName: apiUser.displayName || req.login || '',
            profile_image_url: apiUser.profileImageUrl
        });

        const url = frontendPagePath(
            overlayPagePath(tool),
            `overlayToken=${encodeURIComponent(overlayToken)}`
        );

        return res.json({ url });
    } catch (e) {
        logger.error('Error creating overlay link:', e);
        return jsonError(res, 500, 'Error al generar el enlace del overlay.');
    }
};
