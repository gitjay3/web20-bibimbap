import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueTokenGuard } from './guards/queue-token.guard';
import {
  QueueCleanupProcessor,
  QUEUE_CLEANUP_QUEUE,
} from './queue-cleanup-processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_CLEANUP_QUEUE,
    }),
  ],
  controllers: [QueueController],
  providers: [QueueService, QueueTokenGuard, QueueCleanupProcessor],
  exports: [QueueService, QueueTokenGuard],
})
export class QueueModule {}
