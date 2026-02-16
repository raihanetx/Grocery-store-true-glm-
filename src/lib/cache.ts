// Simple in-memory cache for API responses
// Expires after specified milliseconds

interface CacheItem<T> {
  data: T;
  expiry: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<unknown>>();
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  set<T>(key: string, data: T, ttlMs: number = 30000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }
  
  delete(pattern: string): void {
    // Delete all keys that match pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();
