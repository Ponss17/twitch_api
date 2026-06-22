import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { logger } from '../utils/logger';

export const validate =
    (schema: ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
        const result = await schema.safeParseAsync({
            body: req.body,
            query: req.query,
            params: req.params
        });

        if (result.success) {
            const data = result.data as Record<string, unknown>;

            // En Express 5, algunas propiedades como req.query pueden ser de solo lectura mediante asignación directa
            if (data.body) req.body = data.body;

            // Para query y params, intentamos actualizar las propiedades individuales para evitar el error de "only a getter"
            if (data.query) {
                try {
                    // Si req.query es un objeto mutable, lo actualizamos
                    Object.assign(req.query, data.query);
                } catch (_e) {
                    // Fallback para Express 5 si la propiedad es estrictamente de solo lectura
                    res.locals.query = data.query;
                }
            }

            if (data.params) {
                try {
                    Object.assign(req.params, data.params);
                } catch (_e) {
                    res.locals.params = data.params;
                }
            }

            return next();
        }

        // Si la validación falla
        const errorDetails = result.error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message
        }));

        const safeUrl = req.originalUrl.replace(
            /([?&])(apiKey|token|access_token|refresh_token)=([^&]*)/gi,
            '$1$2=[REDACTED]'
        );

        logger.error('❌ [Validation Error]:', {
            path: safeUrl,
            issues: errorDetails
        });

        return res.status(400).json({
            error: 'Error de validación',
            details: errorDetails
        });
    };
