import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate =
    (schema: ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = (await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            })) as { body: unknown; query: unknown; params: unknown };

            req.body = parsed.body || req.body;
            req.query = (parsed.query as unknown as typeof req.query) || req.query;
            req.params = (parsed.params as unknown as typeof req.params) || req.params;

            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Error de validación',
                    details: error.issues.map((e) => ({
                        path: e.path.join('.'),
                        message: e.message
                    }))
                });
            }
            return res.status(400).json({ error: 'Entrada inválida' });
        }
    };
