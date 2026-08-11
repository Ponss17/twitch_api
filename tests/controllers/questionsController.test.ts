import { Response } from 'express';

jest.mock('../../backend/src/core/database/questionsService', () => ({
    MAX_STREAMER_QUESTIONS: 100,
    STREAMER_QUESTIONS_MAX_AGE_DAYS: 7,
    listStreamerQuestions: jest.fn(),
    addStreamerQuestion: jest.fn(),
    updateStreamerQuestionStatus: jest.fn(),
    deleteStreamerQuestion: jest.fn(),
    clearStreamerQuestions: jest.fn()
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

import * as questionsService from '../../backend/src/core/database/questionsService';
import {
    addQuestion,
    clearQuestions,
    deleteQuestion,
    listQuestions,
    updateQuestion
} from '../../backend/src/features/tools/questions.controller';
import { AuthenticatedRequest } from '@/types/twitch';

const sampleItem = {
    id: 'q1',
    username: 'viewer',
    displayName: 'Viewer',
    text: 'hola?',
    createdAt: 1_700_000_000_000,
    status: 'pending' as const
};

const mockReq = (overrides = {}) =>
    ({
        userId: '123',
        query: {},
        body: {},
        params: {},
        ...overrides
    }) as unknown as AuthenticatedRequest;

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('questionsController', () => {
    beforeEach(() => jest.clearAllMocks());

    it('lists questions with retention metadata', async () => {
        (questionsService.listStreamerQuestions as jest.Mock).mockResolvedValue([sampleItem]);
        const req = mockReq();
        const res = mockRes();

        await listQuestions(req, res);

        expect(questionsService.listStreamerQuestions).toHaveBeenCalledWith('123');
        expect(res.json).toHaveBeenCalledWith({
            items: [sampleItem],
            maxItems: 100,
            maxAgeDays: 7
        });
    });

    it('adds a question', async () => {
        (questionsService.addStreamerQuestion as jest.Mock).mockResolvedValue([sampleItem]);
        const req = mockReq({
            body: {
                id: 'q1',
                username: 'viewer',
                displayName: 'Viewer',
                text: 'hola?',
                status: 'pending',
                createdAt: sampleItem.createdAt
            }
        });
        const res = mockRes();

        await addQuestion(req, res);

        expect(questionsService.addStreamerQuestion).toHaveBeenCalledWith('123', {
            id: 'q1',
            username: 'viewer',
            displayName: 'Viewer',
            text: 'hola?',
            status: 'pending',
            createdAt: sampleItem.createdAt
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ items: [sampleItem] });
    });

    it('updates status', async () => {
        const answered = { ...sampleItem, status: 'answered' as const };
        (questionsService.updateStreamerQuestionStatus as jest.Mock).mockResolvedValue([answered]);
        const req = mockReq({ params: { id: 'q1' }, body: { status: 'answered' } });
        const res = mockRes();

        await updateQuestion(req, res);

        expect(questionsService.updateStreamerQuestionStatus).toHaveBeenCalledWith(
            '123',
            'q1',
            'answered'
        );
        expect(res.json).toHaveBeenCalledWith({ items: [answered] });
    });

    it('deletes one question', async () => {
        (questionsService.deleteStreamerQuestion as jest.Mock).mockResolvedValue([]);
        const req = mockReq({ params: { id: 'q1' } });
        const res = mockRes();

        await deleteQuestion(req, res);

        expect(questionsService.deleteStreamerQuestion).toHaveBeenCalledWith('123', 'q1');
        expect(res.json).toHaveBeenCalledWith({ items: [] });
    });

    it('clears only done questions when done=1', async () => {
        (questionsService.clearStreamerQuestions as jest.Mock).mockResolvedValue([sampleItem]);
        const req = mockReq({ query: { done: '1' } });
        const res = mockRes();

        await clearQuestions(req, res);

        expect(questionsService.clearStreamerQuestions).toHaveBeenCalledWith('123', true);
        expect(res.json).toHaveBeenCalledWith({ items: [sampleItem] });
    });

    it('rejects unauthenticated requests', async () => {
        const req = mockReq({ userId: undefined });
        const res = mockRes();

        await listQuestions(req, res);

        expect(questionsService.listStreamerQuestions).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
    });
});
