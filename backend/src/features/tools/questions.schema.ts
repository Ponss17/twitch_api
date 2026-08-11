import { z } from 'zod';

const questionStatus = z.enum(['pending', 'answered', 'skipped']);

export const listQuestionsSchema = z.object({
    query: z.object({}).optional()
});

export const addQuestionSchema = z.object({
    body: z.object({
        id: z.string().min(1).max(120),
        username: z.string().min(1).max(64),
        displayName: z.string().min(1).max(64),
        text: z.string().min(1).max(500),
        status: questionStatus.optional(),
        createdAt: z.number().int().positive().optional()
    })
});

export const updateQuestionSchema = z.object({
    params: z.object({
        id: z.string().min(1).max(120)
    }),
    body: z.object({
        status: questionStatus
    })
});

export const deleteQuestionSchema = z.object({
    params: z.object({
        id: z.string().min(1).max(120)
    })
});

export const clearQuestionsSchema = z.object({
    query: z.object({
        done: z
            .union([z.literal('1'), z.literal('true'), z.literal('0'), z.literal('false')])
            .optional()
    })
});
