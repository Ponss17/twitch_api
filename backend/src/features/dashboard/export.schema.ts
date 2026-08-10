import { z } from 'zod';

export const exportCheckSchema = z.object({
    body: z.object({}).optional()
});

export const exportCompleteSchema = z.object({
    body: z
        .object({
            exportId: z.string().max(128).optional()
        })
        .optional()
});
