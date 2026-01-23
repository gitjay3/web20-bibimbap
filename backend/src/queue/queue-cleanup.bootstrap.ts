import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUE_CLEANUP_QUEUE,
  GLOBAL_CLEANUP_JOB,
  GLOBAL_CLEANUP_EVERY_MS,
  GLOBAL_CLEANUP_JOB_ID,
} from './queue.constants';

@Injectable()
export class QueueCleanupBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(QueueCleanupBootstrapService.name);

  constructor(
    @InjectQueue(QUEUE_CLEANUP_QUEUE)
    private readonly cleanupQueue: Queue,
  ) {}

  async onModuleInit() {
    try {
      await this.cleanupQueue.add(
        GLOBAL_CLEANUP_JOB,
        {},
        {
          repeat: { every: GLOBAL_CLEANUP_EVERY_MS },
          jobId: GLOBAL_CLEANUP_JOB_ID,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      this.logger.log(`Registered repeat job: ${GLOBAL_CLEANUP_JOB}`);
    } catch (err) {
      // 이미 등록된 경우
      this.logger.warn(
        `Failed to register repeat job (maybe already exists): ${String(err)}`,
      );
    }
  }
}
