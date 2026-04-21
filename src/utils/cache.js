/**
 * Centralized Caching Engine for Turismo Raraz
 * Supports Memory + LocalStorage persistence with TTL and versioning.
 */

const CACHE_PREFIX = "raraz_cache_";
const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
  }

  /**
   * Set a value in the cache
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttl - Time to live in ms
   */
  set(key, value, ttl = DEFAULT_TTL) {
    const entry = {
      value,
      expiry: Date.now() + ttl,
      version: 1
    };

    const fullKey = CACHE_PREFIX + key;
    
    // Memory Cache
    this.memoryCache.set(fullKey, entry);

    // Persistent Cache
    try {
      localStorage.setItem(fullKey, JSON.stringify(entry));
    } catch (e) {
      console.warn("Storage quota exceeded, using memory only.");
    }

    return value;
  }

  /**
   * Get a value from the cache
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const fullKey = CACHE_PREFIX + key;

    // Try Memory first (Fastest)
    let entry = this.memoryCache.get(fullKey);

    // Try LocalStorage
    if (!entry) {
      try {
        const raw = localStorage.getItem(fullKey);
        if (raw) {
          entry = JSON.parse(raw);
          this.memoryCache.set(fullKey, entry); // Hydrate memory
        }
      } catch (e) {
        return null;
      }
    }

    if (!entry) return null;

    // Check Expiry
    if (Date.now() > entry.expiry) {
      this.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete a key from cache
   * @param {string} key 
   */
  delete(key) {
    const fullKey = CACHE_PREFIX + key;
    this.memoryCache.delete(fullKey);
    try {
      localStorage.removeItem(fullKey);
    } catch (e) {}
  }

  /**
   * Clear all cache entries managed by this engine
   */
  clear() {
    this.memoryCache.clear();
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
