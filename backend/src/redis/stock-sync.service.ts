import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class StockSyncService implements OnModuleInit {
  private readonly logger = new Logger(StockSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    await this.syncAllStocks();
  }

  async syncAllStocks(): Promise<void> {
    this.logger.log('Starting stock synchronization...');

    const slots = await this.prisma.eventSlot.findMany({
      select: {
        id: true,
        maxCapacity: true,
        currentCount: true,
      },
    });

    for (const slot of slots) {
      await this.redisService.initStock(
        slot.id,
        slot.maxCapacity,
        slot.currentCount,
      );
    }

    this.logger.log(`Synchronized ${slots.length} slots to Redis`);
  }
}
