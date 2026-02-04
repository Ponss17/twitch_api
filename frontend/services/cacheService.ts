interface CacheEntry {
    data: unknown;
    timestamp: number;
    ttl: number;
}

export const CACHE_TTL = 60000;

export class CacheService {
    private cache: Map<string, CacheEntry>;

    constructor() {
        this.cache = new Map();

        setInterval(() => this.cleanup(), 60000);
    }

    set<T>(key: string, data: T, ttl: number) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    get<T = unknown>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const now = Date.now();
        const age = now - entry.timestamp;

        if (age > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    has(key: string) {
        return this.get(key) !== null;
    }

    clear(key: string) {
        this.cache.delete(key);
    }

    clearAll() {
        this.cache.clear();
    }

    cleanup() {
        const now = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            const age = now - entry.timestamp;
            if (age > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }

    getStats() {
        return {
            size: this.cache.size
        };
    }
}

export const cache = new CacheService();
