/**
 * Redis client configuration
 */

import Redis from 'ioredis';

let redisClient = null;

/**
 * Initialize Redis connection
 */
export async function initRedis() {
  try {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('REDIS_URL not found, using RAM for rate limiting');
      return null;
    }

    const config = {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    // Enable TLS if using rediss://
    if (redisUrl.startsWith('rediss://')) {
      config.tls = {
        rejectUnauthorized: false, // For Upstash compatibility
      };
    }

    redisClient = new Redis(redisUrl, config);

    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout (5s)'));
      }, 5000);

      redisClient.once('connect', () => {
        clearTimeout(timeout);
        console.log('Redis connected successfully');
        resolve();
      });

      redisClient.once('error', (err) => {
        clearTimeout(timeout);
        console.error('Redis connection error:', err.message);
        reject(err);
      });
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    console.warn('Continuing with memory-based rate limiting');
    redisClient = null;
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient() {
  return redisClient;
}

export { redisClient as redis };

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
}
