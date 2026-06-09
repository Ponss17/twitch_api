const isStaticAsset = (path: string): boolean => {
    return (
        /\.(webp|png|jpg|jpeg|gif|css|js|ico|svg|woff2?|map|json)$/i.test(path) ||
        /\/(css|js|img)\//i.test(path)
    );
};

export const isBotCommand = (path: string): boolean =>
    path.includes('/followage') ||
    path.includes('/shoutout') ||
    path.includes('/create-clip') ||
    path.includes('/send-message');

export const isApiRoute = (path: string): boolean =>
    path.startsWith('/api') || path.startsWith('/twitch');

/**
 * Determina si una ruta es una vista HTML pública (como la página del dashboard o docu).
 * Si es una llamada de datos (API) o una acción (POST/DELETE), devuelve false para que el middleware valide la sesión.
 *
 * @param path Ruta limpia (sin queries ni barras múltiples)
 * @param method Método HTTP (GET, POST, etc.)
 * @returns true si se puede servir sin sesión de Twitch (página pública), false si requiere autenticación.
 */
export const isPublicRoute = (path: string, method: string = 'GET'): boolean => {
    const cleanPath = path.split('?')[0].replace(/\/+/g, '/').replace(/\/$/, '') || '/';

    // 1. Static Assets (Always public)
    if (isStaticAsset(cleanPath) || cleanPath.startsWith('/img/')) return true;

    // 2. Siempre es privado si no es un GET (acciones de escritura) en rutas sensibles
    // Las páginas HTML públicas siempre se sirven vía GET.
    const sensitiveBases = ['/minigames'];
    const isSensitiveBase = sensitiveBases.some(
        (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
    );

    if (isSensitiveBase && method !== 'GET') {
        return false;
    }

    // 3. Rutas de Datos API (AJAX/Fetch): Siempre son PRIVADAS (requieren sesión o API Key)
    // Bloqueamos cualquier sub-ruta que pida datos sensitivos del usuario
    const apiDataPatterns = [
        '/activity',
        '/summary',
        '/analytics',
        '/chatters',
        '/user-info',
        '/get-clips',
        '/clear-data',
        '/delete-account',
        '/track-usage',
        '/health-cron'
    ];

    const isApiDataRoute = apiDataPatterns.some((pattern) => cleanPath.includes(pattern));
    if (isApiDataRoute) return false;

    // 4. Rutas exactas públicas (System & SEO)
    const publicExactRoutes = [
        '/health',
        '/api/twitch/health',
        '/api/twitch/system/health',
        '/robots.txt',
        '/api/twitch/robots.txt',
        '/sitemap.xml',
        '/api/twitch/sitemap.xml',
        '/docs',
        '/api/twitch/docs',
        '/sobre-la-api',
        '/api/twitch/sobre-la-api'
    ];
    if (publicExactRoutes.includes(cleanPath)) return true;

    // 4.1 Rutas de Sistema Vercel (Speed Insights, Analytics)
    if (cleanPath.startsWith('/_vercel')) return true;

    // 5. Auth Flows
    if (
        cleanPath === '/auth' ||
        cleanPath.startsWith('/auth/') ||
        cleanPath.startsWith('/api/twitch/auth/') ||
        cleanPath.includes('/callback')
    ) {
        return true;
    }

    // 6. Vistas HTML Públicas adicionales (si las hubiera en el futuro)
    const publicHtmlPaths: string[] = [];

    const isHtmlPath = publicHtmlPaths.some(
        (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
    );

    return isHtmlPath;
};
