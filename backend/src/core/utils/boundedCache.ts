/**
 * BoundedMap — Map with automatic eviction when exceeding max size.
 * Evicts 25% of entries (oldest first) when capacity is reached.
 */
export class BoundedMap<K, V> {
    private map = new Map<K, V>();
    constructor(private maxSize: number) {}

    get(key: K): V | undefined {
        return this.map.get(key);
    }

    set(key: K, value: V): void {
        this.map.set(key, value);
        if (this.map.size > this.maxSize) {
            const toRemove = Math.floor(this.maxSize * 0.25);
            const it = this.map.keys();
            for (let i = 0; i < toRemove; i++) {
                const result = it.next();
                if (result.done) break;
                this.map.delete(result.value);
            }
        }
    }

    has(key: K): boolean {
        return this.map.has(key);
    }

    delete(key: K): boolean {
        return this.map.delete(key);
    }

    get size(): number {
        return this.map.size;
    }

    clear(): void {
        this.map.clear();
    }

    entries(): IterableIterator<[K, V]> {
        return this.map.entries();
    }
}

/**
 * BoundedSet — Set with automatic eviction when exceeding max size.
 * Removes a fixed number of entries (oldest first) when capacity is reached.
 */
export class BoundedSet<K> {
    private set = new Set<K>();
    constructor(
        private maxSize: number,
        private evictCount: number
    ) {}

    add(key: K): void {
        this.set.add(key);
        if (this.set.size > this.maxSize) {
            const it = this.set.values();
            for (let i = 0; i < this.evictCount; i++) {
                const result = it.next();
                if (result.done) break;
                this.set.delete(result.value);
            }
        }
    }

    has(key: K): boolean {
        return this.set.has(key);
    }

    delete(key: K): boolean {
        return this.set.delete(key);
    }

    get size(): number {
        return this.set.size;
    }

    clear(): void {
        this.set.clear();
    }
}

/**
 * NegativeCache — Tracks keys that should be temporarily rejected.
 * Entries expire after a configurable TTL.
 */
export class NegativeCache<K> {
    private cache = new Map<K, number>();
    constructor(private ttlMs: number) {}

    set(key: K): void {
        this.cache.set(key, Date.now() + this.ttlMs);
    }

    has(key: K): boolean {
        const expiry = this.cache.get(key);
        if (!expiry) return false;
        if (Date.now() > expiry) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    delete(key: K): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}
