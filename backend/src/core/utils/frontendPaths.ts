import { CONFIG } from '../config/env';

/** Mount canónico del frontend en ttv.losperris.dev (raíz). Debe coincidir con src/core/config/paths.ts */
export const APP_MOUNT = '';

export function getAppBasePath(): string {
    return APP_MOUNT;
}

/** Ruta hacia una página Astro (dashboard, landing con query, etc.) */
export function frontendPagePath(page: string, search = ''): string {
    const segment = page.startsWith('/') ? page : `/${page}`;
    const mounted = segment === '/' ? `${APP_MOUNT}/` : `${APP_MOUNT}${segment}`;
    const suffix = search ? (search.startsWith('?') ? search : `?${search}`) : '';

    // Dev: Astro en :4321 — nunca usar el origen de la API (:3000).
    if (CONFIG.NODE_ENV === 'development') {
        return `http://localhost:4321${mounted}${suffix}`;
    }

    if (CONFIG.FRONTEND_URL) {
        return `${CONFIG.FRONTEND_URL.replace(/\/$/, '')}${mounted}${suffix}`;
    }

    try {
        return `${new URL(CONFIG.BASE_URL).origin}${mounted}${suffix}`;
    } catch {
        return `${mounted}${suffix}`;
    }
}

/** Fin de la ventana de rate limit (ms epoch) para redirigir a /429?until=… */
export function rateLimitWindowEnd(windowMs: number, now = Date.now()): number {
    return Math.floor(now / windowMs) * windowMs + windowMs;
}

export function rateLimitPagePath(windowMs: number): string {
    return frontendPagePath('/429', `until=${rateLimitWindowEnd(windowMs)}`);
}