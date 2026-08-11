const REDACTED = '[REDACTED]';
const MAX_DEPTH = 8;
const SENSITIVE_KEY = /^(authorization|proxy-authorization|cookie|set-cookie|secret|client[_-]?secret|token|access[_-]?token|refresh[_-]?token|api[_-]?key|password)$/i;
const URL_KEY = /^(url|uri|href|endpoint|originalUrl|requestUrl)$/i;
const URL_SECRET = /([?&])(authorization|cookie|secret|client[_-]?secret|token|access[_-]?token|refresh[_-]?token|api[_-]?key|password)=([^&#]*)/gi;

function redactUrl(value: string): string {
    let safe = value.replace(URL_SECRET, '$1$2=[REDACTED]');
    try {
        const parsed = new URL(safe);
        if (parsed.username || parsed.password) {
            parsed.username = REDACTED;
            parsed.password = REDACTED;
            safe = parsed.toString();
        }
    } catch {
        // Relative URLs and ordinary strings are handled by the query-string regexp.
    }
    return safe;
}

function isAxiosError(value: Record<string, unknown>): boolean {
    return value.isAxiosError === true || value.name === 'AxiosError';
}

function sanitizeAxiosError(value: Record<string, unknown>, seen: WeakSet<object>): Record<string, unknown> {
    const config = value.config && typeof value.config === 'object'
        ? value.config as Record<string, unknown>
        : undefined;
    const response = value.response && typeof value.response === 'object'
        ? value.response as Record<string, unknown>
        : undefined;

    return {
        name: typeof value.name === 'string' ? value.name : 'AxiosError',
        message: typeof value.message === 'string' ? value.message : undefined,
        code: typeof value.code === 'string' ? value.code : undefined,
        status: typeof value.status === 'number' ? value.status : response?.status,
        method: typeof config?.method === 'string' ? config.method : undefined,
        url: typeof config?.url === 'string' ? redactUrl(config.url) : undefined,
        responseData: sanitizeLogValue(response?.data, seen, 1)
    };
}

export function sanitizeLogValue(
    value: unknown,
    seen: WeakSet<object> = new WeakSet(),
    depth = 0
): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return redactUrl(value);
    if (typeof value !== 'object') return value;
    if (depth >= MAX_DEPTH) return '[Max depth]';
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    const record = value as Record<string, unknown>;
    if (isAxiosError(record)) return sanitizeAxiosError(record, seen);
    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack
        };
    }
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeLogValue(item, seen, depth + 1));
    }

    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(record)) {
        if (SENSITIVE_KEY.test(key)) {
            result[key] = REDACTED;
        } else if (URL_KEY.test(key) && typeof child === 'string') {
            result[key] = redactUrl(child);
        } else {
            result[key] = sanitizeLogValue(child, seen, depth + 1);
        }
    }
    return result;
}
