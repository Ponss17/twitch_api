// frontend/shared/utils/apiCache.ts
var APICache = {
  cache: /* @__PURE__ */ new Map(),
  async fetch(url, options = {}, ttl = 6e4) {
    const key = url + JSON.stringify(options);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    return data;
  },
  clear() {
    this.cache.clear();
  },
  invalidate(url) {
    for (const [key] of this.cache) {
      if (key.startsWith(url)) {
        this.cache.delete(key);
      }
    }
  }
};
export {
  APICache
};
