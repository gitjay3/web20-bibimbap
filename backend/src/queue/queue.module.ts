import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueTokenGuard } from './guards/queue-token.guard';
import { QueueCleanupProcessor } from './queue-cleanup-processor';
import { QueueCleanupBootstrapService } from './queue-cleanup.bootstrap';
import { QUEUE_CLEANUP_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_CLEANUP_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000, // 1초 → 2초 → 4초
        },
        removeOnComplete: true,
        removeOnFail: false, // 실패한 작업은 디버깅을 위해 유지
      },
    }),
  ],
  controllers: [QueueController],
  providers: [
    QueueService,
    QueueTokenGuard,
    QueueCleanupProcessor,
    QueueCleanupBootstrapService,
  ],
  exports: [QueueService, QueueTokenGuard],
})
export class QueueModule {}
