import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QUEUE_CLEANUP_QUEUE, GLOBAL_CLEANUP_JOB } from './queue.constants';

@Processor(QUEUE_CLEANUP_QUEUE)
export class QueueCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueCleanupProcessor.name);

  constructor(private readonly queueService: QueueService) {
    super();
  }

  async process(job: Job): Promise<number> {
    if (job.name !== GLOBAL_CLEANUP_JOB) return 0;

    const eventIds = await this.queueService.getActiveEventIds();

    let totalRemoved = 0;

    for (const eventId of eventIds) {
      try {
        totalRemoved += await this.queueService.cleanupExpiredUsers(eventId);
      } catch (err) {
        this.logger.warn(
          `cleanupExpiredUsers failed: eventId=${eventId}, err=${String(err)}`,
        );
      }
    }

    return totalRemoved;
  }
}
