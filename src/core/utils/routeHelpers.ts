const isStaticAsset = (path: string): boolean => {
    return (
        /\.(webp|png|jpg|jpeg|gif|css|js|ico|svg|woff2?|map|json)$/i.test(path) ||
        /\/(css|js|img)\//i.test(path)
    );
};

export const isPublicRoute = (path: string): boolean => {
    const cleanPath = path.split('?')[0];

    // 1. Static Assets (Always public)
    if (isStaticAsset(cleanPath) || cleanPath.startsWith('/img/')) return true;

    // 2. System Critical Routes & Admin Routes
    const publicExactRoutes = [
        '/health',
        '/api/twitch/health',
        '/api/twitch/system/health',
        '/api/twitch/system/health-cron',
        '/api/health-cron',
        '/robots.txt',
        '/api/twitch/robots.txt',
        '/sitemap.xml',
        '/api/twitch/sitemap.xml',
        '/docs',
        '/api/twitch/docs',
        '/_vercel/speed-insights/vitals'
    ];
    if (publicExactRoutes.includes(cleanPath)) return true;

    // 2.5 Admin API Routes (These have their own rate limiters and auth in routes/admin.ts)
    if (
        cleanPath.startsWith('/api/admin') ||
        cleanPath.startsWith('/api/twitch/admin') ||
        cleanPath.startsWith('/admin/api')
    ) {
        return true;
    }

    // 3. Auth Flows
    if (
        cleanPath === '/auth' ||
        cleanPath.startsWith('/auth/') ||
        cleanPath.startsWith('/api/twitch/auth/') ||
        cleanPath.includes('/callback')
    ) {
        return true;
    }

    // 4. Public HTML Views (Served as HTML)
    // Solo las entradas principales del dashboard/minigames son públicas
    const publicHtmlPaths = ['/dashboard', '/minigames', '/admin'];
    const isHtmlPath = publicHtmlPaths.some(
        (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
    );

    if (isHtmlPath) {
        // PERO si contiene /api/ o es una de las subrutas de datos conocidas, NO es pública
        const isApiDataRoute =
            cleanPath.includes('/api/') ||
            cleanPath.includes('/activity') ||
            cleanPath.includes('/analytics') ||
            cleanPath.includes('/chatters') ||
            cleanPath.includes('/user-info') ||
            cleanPath.includes('/get-clips');

        if (isApiDataRoute) return false;

        return true;
    }

    return false;
};
