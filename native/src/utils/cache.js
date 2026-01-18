/**
 * Simple in-memory cache for HomeScreen data
 * Reduces database load by caching data for 30-60 minutes
 */

class SimpleCache {
  constructor() {
    this.cache = new Map()
  }

  /**
   * Set a value in cache with TTL (time to live in milliseconds)
   */
  set(key, value, ttl = 30 * 60 * 1000) { // Default 30 minutes
    const expiry = Date.now() + ttl
    this.cache.set(key, { value, expiry })
  }

  /**
   * Get a value from cache (returns null if expired or not found)
   */
  get(key) {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  /**
   * Clear a specific key
   */
  clear(key) {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clearAll() {
    this.cache.clear()
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

// Export singleton
export const cache = new SimpleCache()
export default cache
