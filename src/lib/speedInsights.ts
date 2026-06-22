function isLocalDevHost(hostname: string): boolean {
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.local')
    );
}

/** Solo en producción (Vercel). En local ese script no existe y devuelve 404. */
export function initSpeedInsights(): void {
    if (typeof window === 'undefined') return;
    if (document.querySelector('script[data-speed-insights]')) return;

    const { hostname, origin } = window.location;
    if (isLocalDevHost(hostname)) return;

    const script = document.createElement('script');
    script.dataset.speedInsights = 'true';
    script.defer = true;
    script.src = `${origin}/_vercel/speed-insights/script.js`;
    document.head.appendChild(script);
}
