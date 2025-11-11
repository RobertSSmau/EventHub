/**
 * Token blacklist with Redis (fallback to in-memory)
 */

import { getRedisClient } from '../config/redis.js';
import jwt from 'jsonwebtoken';

// In-memory fallback
const blacklistedTokens = new Set();

const BLACKLIST_PREFIX = 'blacklist:';

/**
 * Add token to blacklist with TTL
 */
export async function addToBlacklist(token) {
  const redis = getRedisClient();

  if (redis) {
    try {
      // Decode token to get expiration
      const decoded = jwt.decode(token);
      const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 7200; // 2h default

      if (ttl > 0) {
        await redis.setex(`${BLACKLIST_PREFIX}${token}`, ttl, '1');
      }
    } catch (error) {
      console.error('Redis addToBlacklist error:', error.message);
      blacklistedTokens.add(token);
    }
  } else {
    blacklistedTokens.add(token);
  }
}

/**
 * Check if token is blacklisted
 */
export async function isBlacklisted(token) {
  const redis = getRedisClient();

  if (redis) {
    try {
      const exists = await redis.exists(`${BLACKLIST_PREFIX}${token}`);
      return exists === 1;
    } catch (error) {
      console.error('Redis isBlacklisted error:', error.message);
      return blacklistedTokens.has(token);
    }
  }

  return blacklistedTokens.has(token);
}

/**
 * Remove token from blacklist
 */
export async function removeFromBlacklist(token) {
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.del(`${BLACKLIST_PREFIX}${token}`);
    } catch (error) {
      console.error('Redis removeFromBlacklist error:', error.message);
      blacklistedTokens.delete(token);
    }
  } else {
    blacklistedTokens.delete(token);
  }
}

/**
 * Clear all blacklisted tokens
 */
export async function clearBlacklist() {
  const redis = getRedisClient();

  if (redis) {
    try {
      const keys = await redis.keys(`${BLACKLIST_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis clearBlacklist error:', error.message);
      blacklistedTokens.clear();
    }
  } else {
    blacklistedTokens.clear();
  }
}

/**
 * Get blacklist size (approximate for Redis)
 */
export async function getBlacklistSize() {
  const redis = getRedisClient();

  if (redis) {
    try {
      const keys = await redis.keys(`${BLACKLIST_PREFIX}*`);
      return keys.length;
    } catch (error) {
      console.error('Redis getBlacklistSize error:', error.message);
      return blacklistedTokens.size;
    }
  }

  return blacklistedTokens.size;
}
