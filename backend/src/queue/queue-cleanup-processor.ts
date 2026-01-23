import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QueueService } from './queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_CLEANUP_QUEUE, GLOBAL_CLEANUP_JOB } from './queue.constants';

@Processor(QUEUE_CLEANUP_QUEUE)
export class QueueCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueCleanupProcessor.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<number> {
    if (job.name !== GLOBAL_CLEANUP_JOB) return 0;

    const now = new Date();

    // TODO: 진행 중 이벤트를 매번 DB에서 조회하지 않게 개선하기
    const events = await this.prisma.event.findMany({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
      },
      select: { id: true },
    });

    let totalRemoved = 0;

    for (const e of events) {
      try {
        totalRemoved += await this.queueService.cleanupExpiredUsers(e.id);
      } catch (err) {
        this.logger.warn(
          `cleanupExpiredUsers failed: eventId=${e.id}, err=${String(err)}`,
        );
      }
    }

    return totalRemoved;
  }
}
