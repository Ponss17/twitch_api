/** Extrae mensaje de error API (formato unificado o legacy). */
export function extractApiErrorMessage(body: unknown, fallback = 'Error desconocido'): string {
    if (body == null) return fallback;
    if (typeof body === 'string') {
        const trimmed = body.trim();
        return trimmed || fallback;
    }

    if (typeof body !== 'object') return fallback;

    const record = body as Record<string, unknown>;

    if (record.success === false && record.error && typeof record.error === 'object') {
        const nested = record.error as { message?: unknown; details?: unknown };
        if (Array.isArray(nested.details) && nested.details.length > 0) {
            const first = nested.details[0] as { message?: unknown };
            if (typeof first.message === 'string' && first.message.trim()) {
                return first.message.trim();
            }
        }
        if (typeof nested.message === 'string' && nested.message.trim()) {
            return nested.message.trim();
        }
    }

    if (typeof record.error === 'string' && record.error.trim()) {
        return record.error.trim();
    }

    if (typeof record.message === 'string' && record.message.trim()) {
        return record.message.trim();
    }

    return fallback;
}

/** Formato consistente para UI del dashboard (español). */
export function formatApiErrorForUi(message: string): string {
    const trimmed = message.trim();
    if (!trimmed) return '⚠️ Error desconocido';
    if (trimmed.startsWith('⚠️') || trimmed.startsWith('❌')) return trimmed;
    return `⚠️ ${trimmed}`;
}

/** Parsea texto o JSON de una respuesta HTTP fallida. */
export function parseHttpErrorBody(text: string, fallback?: string): string {
    const base = fallback ?? 'Error desconocido';
    if (!text.trim()) return base;

    try {
        return extractApiErrorMessage(JSON.parse(text) as unknown, text.trim());
    } catch {
        return text.trim();
    }
}
