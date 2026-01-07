interface CacheEntry {
    value: any;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export const get = (key: string): any | null => {
    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }

    return entry.value;
};

export const set = (key: string, value: any, ttlSeconds: number = 60): void => {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    cache.set(key, { value, expiresAt });
};

setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
        if (now > entry.expiresAt) {
            cache.delete(key);
        }
    }
}, 5 * 60 * 1000);
