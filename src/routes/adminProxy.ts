import { Router } from 'express';

/**
 * Intenta cargar el router del panel admin.
 * El archivo admin.ts está en .gitignore (solo local).
 * En producción simplemente devuelve null y las rutas no se registran.
 */
export function loadAdminRouter(): Router | null {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('./admin').default as Router;
    } catch {
        return null;
    }
}
