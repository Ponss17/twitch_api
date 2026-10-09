/** Etiqueta localizada para `YYYY-MM` (reportes / notificaciones). */
export function formatMonthLabel(
    yearMonth: string,
    locale: string,
    options?: { capitalize?: boolean }
): string {
    const [y, m] = yearMonth.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, 1));
    const raw = new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(date);
    if (!options?.capitalize) return raw;
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}
