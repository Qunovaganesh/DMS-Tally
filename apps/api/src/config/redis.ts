import { createClient } from 'redis';
import { logger } from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({
  url: REDIS_URL
});

redis.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

// Connect to Redis
redis.connect().catch((error) => {
  logger.error('Failed to connect to Redis:', error);
});

export default redis;