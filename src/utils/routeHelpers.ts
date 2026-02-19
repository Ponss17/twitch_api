export const isStaticAsset = (path: string): boolean => {
    return (
        /\.(webp|png|jpg|jpeg|gif|css|js|ico|svg|woff2?|map|json|webp)$/i.test(path) ||
        /\/(css|js|img)\//i.test(path)
    );
};

export const isPublicRoute = (path: string): boolean => {
    const cleanPath = path.split('?')[0];

    // 1. Static Assets (Always public)
    if (isStaticAsset(cleanPath) || cleanPath.startsWith('/img/')) return true;

    // 2. System Critical Routes (Exact matches or specific patterns)
    const publicExactRoutes = [
        '/health',
        '/api/twitch/health',
        '/api/twitch/system/health',
        '/robots.txt',
        '/api/twitch/robots.txt',
        '/sitemap.xml',
        '/api/twitch/sitemap.xml',
        '/docs',
        '/api/twitch/docs'
    ];
    if (publicExactRoutes.includes(cleanPath)) return true;

    // 3. Auth Flows
    if (
        cleanPath === '/auth' ||
        cleanPath.startsWith('/auth/') ||
        cleanPath.startsWith('/api/twitch/auth/') ||
        cleanPath.includes('/callback')
    ) {
        return true;
    }

    // 4. Public Views (Served as HTML)
    const publicViewPrefixes = ['/dashboard', '/minigames', '/admin'];
    if (
        publicViewPrefixes.some(
            (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
        )
    ) {
        if (cleanPath.endsWith('/system/validate')) return true;

        if (!cleanPath.includes('/api/')) return true;
    }

    return false;
};
