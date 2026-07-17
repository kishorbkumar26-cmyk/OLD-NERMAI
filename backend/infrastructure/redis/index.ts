import Redis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../core/logger';

// Create the actual Redis instance, but disable offline queue so commands fail fast if disconnected
export const rawRedisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null, // Prevents infinite retry loop if Redis is not installed
});

let isRedisConnected = false;

rawRedisClient.on('error', (err) => {
  isRedisConnected = false;
  if (env.REDIS_REQUIRED) {
    logger.error('CRITICAL: Redis connection failed and REDIS_REQUIRED is true', err);
    process.exit(1);
  } else {
    // Only warn once per startup ideally, but ioredis might retry. We'll let it warn.
  }
});

rawRedisClient.on('ready', () => {
  isRedisConnected = true;
  logger.info('Redis connected successfully.');
});

// In-memory fallback map for development without Redis
const fallbackCache = new Map<string, { value: string, expiry: number }>();

// Expose a wrapper that mimics the redisClient interface we use
export const redisClient = {
  async get(key: string): Promise<string | null> {
    if (isRedisConnected) {
      try { return await rawRedisClient.get(key); } catch (e) { /* fallback */ }
    }
    const record = fallbackCache.get(key);
    if (!record) return null;
    if (Date.now() > record.expiry) {
      fallbackCache.delete(key);
      return null;
    }
    return record.value;
  },

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null> {
    if (isRedisConnected) {
      try { 
        if (mode && duration !== undefined) {
          return await rawRedisClient.set(key, value, mode as any, duration) as 'OK';
        }
        return await rawRedisClient.set(key, value) as 'OK';
      } catch (e) { /* fallback */ }
    }
    const expiry = (mode === 'EX' && duration) ? Date.now() + duration * 1000 : Infinity;
    fallbackCache.set(key, { value, expiry });
    return 'OK';
  },

  async del(key: string): Promise<number> {
    if (isRedisConnected) {
      try { return await rawRedisClient.del(key); } catch (e) { /* fallback */ }
    }
    return fallbackCache.delete(key) ? 1 : 0;
  },

  async ping(): Promise<string> {
    if (isRedisConnected) {
      try { return await rawRedisClient.ping(); } catch (e) { /* fallback */ }
    }
    return 'PONG';
  },

  async scan(cursor: string, matchKeyword: string, pattern: string, countKeyword: string, count: number): Promise<[string, string[]]> {
    if (isRedisConnected) {
      try { return await rawRedisClient.scan(cursor, matchKeyword as any, pattern, countKeyword as any, count); } catch (e) { /* fallback */ }
    }
    // Very basic fallback scan (ignores cursor and just returns all matching keys)
    if (cursor !== '0') return ['0', []];
    
    // Convert redis pattern like `attendance:*` to regex `^attendance:.*$`
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matchedKeys: string[] = [];
    for (const key of fallbackCache.keys()) {
      if (regexPattern.test(key)) {
        matchedKeys.push(key);
      }
    }
    return ['0', matchedKeys];
  },

  async call(command: string, ...args: string[]): Promise<any> {
    if (isRedisConnected) {
      try { return await (rawRedisClient as any).call(command, ...args); } catch (e) { /* fallback */ }
    }
    return null;
  },

  async rpush(key: string, value: string): Promise<number> {
    if (isRedisConnected) {
      try { return await rawRedisClient.rpush(key, value); } catch (e) { /* fallback */ }
    }
    // Fallback: mock list
    return 1;
  },

  async lpop(key: string): Promise<string | null> {
    if (isRedisConnected) {
      try { return await rawRedisClient.lpop(key); } catch (e) { /* fallback */ }
    }
    return null;
  },

  async disconnect(): Promise<void> {
    if (isRedisConnected) {
      try { await rawRedisClient.quit(); } catch (e) { /* ignore */ }
    }
    isRedisConnected = false;
  },

  /**
   * Pipeline: Returns a native ioredis pipeline if Redis is connected.
   * Falls back to a mock pipeline for dev environments without Redis.
   */
  pipeline() {
    if (isRedisConnected) {
      return rawRedisClient.pipeline();
    }
    // Dev fallback: mock pipeline that returns null results
    const mockCommands: Array<[string, string]> = [];
    const mockPipeline = {
      get: (key: string) => { mockCommands.push(['get', key]); return mockPipeline; },
      set: (key: string, value: string) => { mockCommands.push(['set', key]); return mockPipeline; },
      exec: async (): Promise<Array<[Error | null, any]>> => {
        return mockCommands.map(() => [null, null]);
      }
    };
    return mockPipeline;
  }
};

// Startup check
export async function initializeRedis() {
  try {
    await rawRedisClient.connect();
  } catch (error) {
    if (env.REDIS_REQUIRED) {
      logger.error('CRITICAL: Failed to connect to Redis on startup', error);
      process.exit(1);
    } else {
      logger.warn('Redis unavailable. Using in-memory fallback for development.');
    }
  }
}

