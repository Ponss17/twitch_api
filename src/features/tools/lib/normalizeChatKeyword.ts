/** Normaliza un comando de chat a forma `!palabra` (minúsculas del trigger). */
export function normalizeChatKeyword(raw: string, fallback = '!pregunta'): string {
    const trimmed = raw.trim();
    if (!trimmed) return fallback.startsWith('!') ? fallback : `!${fallback}`;
    const withoutBang = trimmed.replace(/^!+/, '');
    if (!withoutBang) return fallback.startsWith('!') ? fallback : `!${fallback}`;
    return `!${withoutBang}`;
}
