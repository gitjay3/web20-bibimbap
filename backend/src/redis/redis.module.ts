import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { StockSyncService } from './stock-sync.service';

@Global()
@Module({
  providers: [RedisService, StockSyncService],
  exports: [RedisService],
})
export class RedisModule {}
