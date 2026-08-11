import { Response } from 'express';
import { AuthenticatedRequest } from '../../types/twitch';
import { jsonError } from '../../core/utils/jsonResponse';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import * as questionsService from '../../core/database/questionsService';

function requireUserId(req: AuthenticatedRequest, res: Response): string | null {
    if (!req.userId) {
        jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND, { code: 'UNAUTHORIZED' });
        return null;
    }
    return req.userId;
}

export const listQuestions = async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    try {
        const items = await questionsService.listStreamerQuestions(userId);
        return res.json({
            items,
            maxItems: questionsService.MAX_STREAMER_QUESTIONS,
            maxAgeDays: questionsService.STREAMER_QUESTIONS_MAX_AGE_DAYS
        });
    } catch (error) {
        logger.error('listQuestions failed:', (error as Error).message);
        return jsonError(res, 500, 'No se pudieron cargar las preguntas', { code: 'INTERNAL_ERROR' });
    }
};

export const addQuestion = async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    try {
        const items = await questionsService.addStreamerQuestion(userId, {
            id: String(req.body.id),
            username: String(req.body.username),
            displayName: String(req.body.displayName),
            text: String(req.body.text),
            status: req.body.status,
            createdAt: req.body.createdAt
        });
        return res.status(201).json({ items });
    } catch (error) {
        logger.error('addQuestion failed:', (error as Error).message);
        return jsonError(res, 500, 'No se pudo guardar la pregunta', { code: 'INTERNAL_ERROR' });
    }
};

export const updateQuestion = async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    try {
        const items = await questionsService.updateStreamerQuestionStatus(
            userId,
            String(req.params.id),
            req.body.status
        );
        return res.json({ items });
    } catch (error) {
        logger.error('updateQuestion failed:', (error as Error).message);
        return jsonError(res, 500, 'No se pudo actualizar la pregunta', { code: 'INTERNAL_ERROR' });
    }
};

export const deleteQuestion = async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    try {
        const items = await questionsService.deleteStreamerQuestion(userId, String(req.params.id));
        return res.json({ items });
    } catch (error) {
        logger.error('deleteQuestion failed:', (error as Error).message);
        return jsonError(res, 500, 'No se pudo eliminar la pregunta', { code: 'INTERNAL_ERROR' });
    }
};

export const clearQuestions = async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const doneRaw = String(req.query.done ?? '');
    const onlyDone = doneRaw === '1' || doneRaw === 'true';
    try {
        const items = await questionsService.clearStreamerQuestions(userId, onlyDone);
        return res.json({ items });
    } catch (error) {
        logger.error('clearQuestions failed:', (error as Error).message);
        return jsonError(res, 500, 'No se pudieron limpiar las preguntas', { code: 'INTERNAL_ERROR' });
    }
};
