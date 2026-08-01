export function maskApiKey(key: string): string {
    if (!key || key.length < 8) return '••••••••••••';
    return `${key.slice(0, 4)}${'•'.repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`;
}

export function formatDate(iso: string, locale: string = 'es'): string {
    if (!iso) return '---';
    try {
        const bcp47 = locale === 'es' ? 'es-ES' : 'en-US';
        return new Date(iso).toLocaleDateString(bcp47, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return iso;
    }
}
