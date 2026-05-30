import Redis from 'ioredis';
import { logger } from './logger';

let redis: Redis | null = null;

export const initializeRedis = async (): Promise<Redis> => {
  try {
    redis = new Redis({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      enableOfflineQueue: true,
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });

    // Test connection
    await redis.ping();
    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis', { error });
    throw error;
  }
};

export const getRedis = (): Redis => {
  if (!redis) {
    throw new Error('Redis not initialized');
  }
  return redis;
};

export const cacheGet = async (key: string): Promise<any> => {
  try {
    const client = getRedis();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Cache get error for key: ${key}`, { error });
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: any,
  ttl = 3600,
): Promise<void> => {
  try {
    const client = getRedis();
    await client.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error(`Cache set error for key: ${key}`, { error });
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  try {
    const client = getRedis();
    await client.del(key);
  } catch (error) {
    logger.error(`Cache delete error for key: ${key}`, { error });
  }
};

export const cacheClear = async (): Promise<void> => {
  try {
    const client = getRedis();
    await client.flushdb();
  } catch (error) {
    logger.error('Cache clear error', { error });
  }
};
