import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import {
  QUEUE_CLEANUP_QUEUE,
  GLOBAL_CLEANUP_JOB,
  GLOBAL_CLEANUP_JOB_ID,
  DEFAULT_CLEANUP_INTERVAL_MS,
} from './queue.constants';

@Injectable()
export class QueueCleanupBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(QueueCleanupBootstrapService.name);

  constructor(
    @InjectQueue(QUEUE_CLEANUP_QUEUE)
    private readonly cleanupQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const intervalMs = this.configService.get<number>(
      'queue.cleanupIntervalMs',
      DEFAULT_CLEANUP_INTERVAL_MS,
    );
    try {
      await this.cleanupQueue.add(
        GLOBAL_CLEANUP_JOB,
        {},
        {
          repeat: { every: intervalMs },
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
