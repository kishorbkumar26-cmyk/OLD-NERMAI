import rateLimit, { Store } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../../infrastructure/redis';
import { env } from '../../config/env';

// Fallback to memory store if Redis is not required/initialized to prevent crashes during local dev
let store: Store | undefined = undefined;

if (env.REDIS_REQUIRED) {
  store = new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)),
  });
}

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window`
  standardHeaders: true, 
  legacyHeaders: false,
  store, // If undefined, express-rate-limit falls back to MemoryStore
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // start blocking after 20 requests
  message: 'Too many authentication attempts from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  store,
});
