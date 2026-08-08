export const safeString = (val: unknown): string => {
    if (typeof val === 'string') return val;
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') return val[0];
    return '';
};

export const toSafePathIdentifier = (val: unknown): string => {
    const normalized = safeString(val).trim().toLowerCase();
    if (!normalized) return '';
    return /^[a-z0-9_]{1,25}$/.test(normalized) ? normalized : '';
};

/**
 * Escapa caracteres HTML peligrosos para prevenir XSS.
 * Usar en cualquier input que se renderice en el DOM.
 */
export const sanitizeHtml = (input: string): string => {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
    };
    return input.replace(/[&<>"']/g, (char) => map[char] || char);
};
