const { supabase } = require('./supabase');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this.defaultTTL = parseInt(process.env.CACHE_TTL) || 3600; // 1 hour default
  }

  async get(key) {
    try {
      const { data, error } = await supabase
        .from('cache')
        .select('value, expires_at')
        .eq('key', key)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if cache has expired
      if (new Date() > new Date(data.expires_at)) {
        await this.delete(key);
        return null;
      }

      logger.debug(`Cache hit for key: ${key}`);
      return data.value;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);
      
      const { error } = await supabase
        .from('cache')
        .upsert({
          key,
          value,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        logger.error('Cache set error:', error);
        return false;
      }

      logger.debug(`Cache set for key: ${key}, expires: ${expiresAt}`);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .eq('key', key);

      if (error) {
        logger.error('Cache delete error:', error);
        return false;
      }

      logger.debug(`Cache deleted for key: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async clear() {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error('Cache clear error:', error);
        return false;
      }

      logger.info('Expired cache entries cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  // Cache wrapper for async functions
  async cached(key, fn, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Clean up expired cache entries every hour
setInterval(() => {
  cacheManager.clear().catch(error => {
    logger.error('Scheduled cache cleanup failed:', error);
  });
}, 60 * 60 * 1000); // 1 hour

module.exports = cacheManager; 