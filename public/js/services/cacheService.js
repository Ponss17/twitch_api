var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// frontend/services/cacheService.ts
var CACHE_TTL = 6e4;
var _CacheService = class _CacheService {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
    setInterval(() => this.cleanup(), 6e4);
  }
  set(key, data, ttl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  get(key) {
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
    return entry.data;
  }
  has(key) {
    return this.get(key) !== null;
  }
  clear(key) {
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
};
__name(_CacheService, "CacheService");
var CacheService = _CacheService;
var cache = new CacheService();
export {
  CACHE_TTL,
  CacheService,
  cache
};
