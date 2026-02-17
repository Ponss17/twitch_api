export const isStaticAsset = (path: string): boolean => {
    return (
        /\.(webp|png|jpg|jpeg|gif|css|js|ico|svg|woff2?|map|json|webp)$/i.test(path) ||
        /\/(css|js|img)\//i.test(path)
    );
};

export const isPublicRoute = (path: string): boolean => {
    // Cleaner path without query params
    const cleanPath = path.split('?')[0];

    // 1. Static Assets (Always public)
    if (isStaticAsset(cleanPath) || cleanPath.startsWith('/img/')) return true;

    // 2. System Critical Routes
    if (
        cleanPath.includes('/health') ||
        cleanPath.includes('/docs') ||
        cleanPath.includes('robots.txt') ||
        cleanPath.includes('sitemap.xml')
    ) {
        return true;
    }

    // 3. Auth Flows (OAuth callbacks, Login)
    if (cleanPath.includes('/auth') || cleanPath.includes('/callback')) {
        return true;
    }

    // 4. Public Views (Dashboard, Minigames - served as HTML)
    // Note: The API data for these might still be protected, but the HTML page/assets shouldn't be blocked hard.
    if (
        cleanPath.includes('/dashboard') ||
        cleanPath.includes('/minigames') ||
        cleanPath.includes('/admin') ||
        // Only specific system routes should be loose, typically validation or public info
        // regenerate-key and feedback should stay protected/limited
        cleanPath.endsWith('/system/validate')
    ) {
        return true;
    }

    return false;
};
