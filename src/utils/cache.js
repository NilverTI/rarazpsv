/**
 * Centralized Caching Engine for Turismo Raraz
 * Supports Memory + LocalStorage persistence with TTL and versioning.
 */

const CACHE_PREFIX = "raraz_cache_";
const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

function normalizeCacheOptions(ttlOrOptions) {
  if (typeof ttlOrOptions === "number") {
    return { ttl: ttlOrOptions, staleTtl: ttlOrOptions, version: 1 };
  }

  const ttl = Math.max(0, ttlOrOptions?.ttl ?? DEFAULT_TTL);
  const staleTtl = Math.max(ttl, ttlOrOptions?.staleTtl ?? ttl);

  return {
    ttl,
    staleTtl,
    version: ttlOrOptions?.version ?? 1,
  };
}

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.storageAvailable = null;
  }

  canUseStorage() {
    if (this.storageAvailable != null) return this.storageAvailable;
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      this.storageAvailable = false;
      return this.storageAvailable;
    }

    try {
      const probeKey = `${CACHE_PREFIX}__probe__`;
      localStorage.setItem(probeKey, "1");
      localStorage.removeItem(probeKey);
      this.storageAvailable = true;
    } catch (e) {
      this.storageAvailable = false;
    }

    return this.storageAvailable;
  }

  buildFullKey(key) {
    return CACHE_PREFIX + key;
  }

  hydrateEntry(fullKey) {
    let entry = this.memoryCache.get(fullKey);
    if (entry) return entry;

    if (!this.canUseStorage()) return null;

    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;

      entry = JSON.parse(raw);
      this.memoryCache.set(fullKey, entry);
      return entry;
    } catch (e) {
      return null;
    }
  }

  getEntryState(entry) {
    if (!entry) return "missing";

    const now = Date.now();
    const staleUntil = entry.staleUntil ?? entry.expiry;

    if (now > staleUntil) return "expired";
    if (now > entry.expiry) return "stale";
    return "fresh";
  }

  /**
   * Set a value in the cache
   * @param {string} key 
   * @param {any} value 
   * @param {number|object} ttlOrOptions - Time to live or full cache options
   */
  set(key, value, ttlOrOptions = DEFAULT_TTL) {
    const options = normalizeCacheOptions(ttlOrOptions);
    const now = Date.now();
    const entry = {
      value,
      expiry: now + options.ttl,
      staleUntil: now + options.staleTtl,
      updatedAt: now,
      version: options.version,
    };

    const fullKey = this.buildFullKey(key);
    
    // Memory Cache
    this.memoryCache.set(fullKey, entry);

    // Persistent Cache
    if (this.canUseStorage()) {
      try {
        localStorage.setItem(fullKey, JSON.stringify(entry));
      } catch (e) {
        console.warn("Storage quota exceeded, using memory only.");
      }
    }

    return value;
  }

  /**
   * Get a value from the cache
   * @param {string} key 
   * @param {object} options
   * @returns {any|null}
   */
  get(key, options = {}) {
    const entry = this.getEntry(key, options);
    return entry ? entry.value : null;
  }

  /**
   * Returns the stored value with freshness metadata
   * @param {string} key
   * @param {object} options
   * @returns {{ value:any, isStale:boolean, expiry:number, staleUntil:number, updatedAt:number, version:number }|null}
   */
  getEntry(key, options = {}) {
    const fullKey = this.buildFullKey(key);
    const entry = this.hydrateEntry(fullKey);

    if (!entry) return null;

    const state = this.getEntryState(entry);
    if (state === "expired") {
      this.delete(key);
      return null;
    }

    if (state === "stale" && !options.allowStale) {
      return null;
    }

    return {
      value: entry.value,
      isStale: state === "stale",
      expiry: entry.expiry,
      staleUntil: entry.staleUntil ?? entry.expiry,
      updatedAt: entry.updatedAt ?? 0,
      version: entry.version ?? 1,
    };
  }

  /**
   * Delete a key from cache
   * @param {string} key 
   */
  delete(key) {
    const fullKey = this.buildFullKey(key);
    this.memoryCache.delete(fullKey);
    if (!this.canUseStorage()) return;

    try {
      localStorage.removeItem(fullKey);
    } catch (e) {}
  }

  /**
   * Clear all cache entries managed by this engine
   */
  clear() {
    this.memoryCache.clear();
    if (!this.canUseStorage()) return;

    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
  }
}

export const cache = new CacheManager();
