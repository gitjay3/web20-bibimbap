import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '10', 10),
  maxRetryDelay: parseInt(process.env.REDIS_MAX_RETRY_DELAY || '3000', 10),
  maxRetriesPerRequest: parseInt(
    process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3',
    10,
  ),
}));
