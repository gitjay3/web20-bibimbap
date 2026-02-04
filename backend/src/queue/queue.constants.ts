export const QUEUE_CLEANUP_QUEUE = 'queue-cleanup';
export const CLEANUP_JOB = 'cleanup-inactive-users';
export interface CleanupJobData {
  eventId: number;
}
export const GLOBAL_CLEANUP_JOB = 'queue-cleanup-global';
export const GLOBAL_CLEANUP_JOB_ID = 'queue-cleanup-global';

export const DEFAULT_CLEANUP_INTERVAL_MS = 30_000;

export const ACTIVE_EVENTS_KEY = 'active:events';
