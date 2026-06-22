interface CacheEntry {
    data: unknown;
    timestamp: number;
    ttl: number;
}

export const CACHE_TTL = 60000;

export class CacheService {
    private cache: Map<string, CacheEntry>;
    private cleanupInterval: ReturnType<typeof setInterval>;
    private readonly MAX_SIZE = 200;

    constructor() {
        this.cache = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    destroy() {
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    }

    set<T>(key: string, data: T, ttl: number) {
        if (this.cache.size >= this.MAX_SIZE && !this.cache.has(key)) {
            const first = this.cache.keys().next().value;
            if (first) this.cache.delete(first);
        }
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    get<T = unknown>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const age = Date.now() - entry.timestamp;
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
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

export const cache = new CacheService();
