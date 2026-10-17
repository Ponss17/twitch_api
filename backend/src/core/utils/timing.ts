import { Request, Response, NextFunction, RequestHandler } from 'express';

const ENABLED = () => process.env.TIMING_LOGS === 'true';

/**
 * Mide cuánto tarda un middleware hasta llamar a next().
 * Activable con TIMING_LOGS=true.
 */
export const timed = (name: string, mw: RequestHandler): RequestHandler =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!ENABLED()) return mw(req, res, next);

        const t0 = performance.now();
        mw(req, res, (err?: unknown) => {
            const ms = (performance.now() - t0).toFixed(0);
            console.log(`[timing] ${name}: ${ms}ms  ${req.method} ${req.originalUrl?.split('?')[0]}`);
            next(err as Error | undefined);
        });
    };

/**
 * Mide una llamada async individual dentro de un controlador.
 * Devuelve [resultado, duraciónMs].
 */
export const timedCall = async <T>(
    label: string,
    fn: () => Promise<T>
): Promise<[T, number]> => {
    if (!ENABLED()) {
        const result = await fn();
        return [result, 0];
    }
    const t0 = performance.now();
    const result = await fn();
    const ms = performance.now() - t0;
    console.log(`[timing]   └─ ${label}: ${ms.toFixed(0)}ms`);
    return [result, ms];
};

/**
 * Mide el tiempo total de un handler de comando.
 * Loguea al terminar.
 */
export const timedHandler = async (
    name: string,
    req: Request,
    fn: () => Promise<void>
): Promise<void> => {
    if (!ENABLED()) return fn();

    const t0 = performance.now();
    try {
        await fn();
    } finally {
        const ms = (performance.now() - t0).toFixed(0);
        console.log(`[timing] HANDLER ${name}: ${ms}ms total  ${req.method} ${req.originalUrl?.split('?')[0]}`);
    }
};

// --- Cold-start ---
const MODULE_LOAD_TIME = performance.now();
let coldStartLogged = false;

/**
 * Llamar una vez al final de la configuración de Express (en app.ts o routes.ts).
 * Mide desde la carga del módulo hasta que Express queda listo.
 */
export const logColdStart = (): void => {
    if (!ENABLED() || coldStartLogged) return;
    coldStartLogged = true;
    const ms = (performance.now() - MODULE_LOAD_TIME).toFixed(0);
    console.log(`[timing] COLD START: ${ms}ms (module load → Express ready)`);
};
