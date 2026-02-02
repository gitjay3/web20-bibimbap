import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  // 대기열 설정
  heartbeatTtl: parseInt(process.env.QUEUE_HEARTBEAT_TTL || '60', 10),
  userStatusTtl: parseInt(process.env.QUEUE_USER_STATUS_TTL || '60', 10),
  tokenTtl: parseInt(process.env.QUEUE_TOKEN_TTL || '300', 10),
  batchSize: parseInt(process.env.QUEUE_BATCH_SIZE || '100', 10),
  maxTokenRetry: parseInt(process.env.QUEUE_MAX_TOKEN_RETRY || '3', 10),
  cleanupIntervalMs: parseInt(
    process.env.QUEUE_CLEANUP_INTERVAL_MS || '30000',
    10,
  ),

  // BullMQ 설정
  jobAttempts: parseInt(process.env.QUEUE_JOB_ATTEMPTS || '3', 10),
  jobBackoffDelay: parseInt(process.env.QUEUE_JOB_BACKOFF_DELAY || '1000', 10),
}));
