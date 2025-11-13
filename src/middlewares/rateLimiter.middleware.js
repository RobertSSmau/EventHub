import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../config/redis.js';

// Create Redis store with deferred client
const createRedisStore = (prefix) => {
  const redis = getRedisClient();
  if (!redis) {
    console.warn(`Redis not available for ${prefix}, using RAM`);
    return undefined;
  }
  
  return new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix,
  });
};

// General API rate limiter (100 requests per 15 minutes)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:general:'),
});

// Strict limiter for auth endpoints (15 requests per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: createRedisStore('rl:auth:'),
});

// Report creation limiter (50 reports per hour per user for testing)
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Too many reports submitted, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id ? `user:${req.user.id}` : `skip:${Date.now()}`;
  },
  skip: (req) => !req.user?.id,
  store: createRedisStore('rl:report:'),
});

// Event creation limiter (10 events per day per user)
export const eventCreationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  message: 'Too many events created today, please try again tomorrow.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id ? `user:${req.user.id}` : `skip:${Date.now()}`;
  },
  skip: (req) => !req.user?.id,
  store: createRedisStore('rl:event:'),
});

// Registration limiter (20 event registrations per hour)
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many event registrations, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id ? `user:${req.user.id}` : `skip:${Date.now()}`;
  },
  skip: (req) => !req.user?.id,
  store: createRedisStore('rl:registration:'),
});

// Logout limiter (30 requests per hour - less restrictive than login)
export const logoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many logout attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:logout:'),
});

// Email sending limiter (3 emails per hour)
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many emails sent, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:email:'),
});
