import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QueueService } from './queue.service';

export const QUEUE_CLEANUP_QUEUE = 'queue-cleanup';
export const CLEANUP_JOB = 'cleanup-inactive-users';

export interface CleanupJobData {
  eventId: number;
}

@Processor(QUEUE_CLEANUP_QUEUE)
export class QueueCleanupProcessor extends WorkerHost {
  constructor(private readonly queueService: QueueService) {
    super();
  }

  async process(job: Job<CleanupJobData>): Promise<number> {
    const { eventId } = job.data;
    const removedCount = await this.queueService.cleanupInactiveUsers(eventId);

    console.log(`[Queue Cleanup] Event ${eventId}: ${removedCount}명 제거됨`);
    return removedCount;
  }
}
