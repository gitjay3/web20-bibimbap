import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  // Lua 스크립트 캐시 (SHA 해시)
  private scripts: {
    decrementStock?: string;
    incrementStock?: string;
    initStock?: string;
  } = {};

  constructor(
    private configService: ConfigService,
    private metricsService: MetricsService,
  ) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      retryStrategy: (times) => {
        if (times > 10) {
          this.logger.error('Redis 재연결 최대 횟수 초과');
          return null; // 재연결 중단
        }
        const delay = Math.min(times * 100, 3000); // 최대 3초
        this.logger.warn(`Redis 재연결 시도 ${times}회, ${delay}ms 후 재시도`);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    // lua script 로드
    try {
      await this.loadScripts();
    } catch (error) {
      this.logger.error('Lua 스크립트 로드 실패:', error);
      throw error;
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  getStockKey(slotId: number): string {
    return `slot:${slotId}:stock`;
  }

  // Lua 스크립트 파일 로드 및 Redis에 등록
  private async loadScripts() {
    const scriptsDir = path.join(__dirname, 'scripts');

    const decrementScript = fs.readFileSync(
      path.join(scriptsDir, 'decrement-stock.lua'),
      'utf-8',
    );
    const incrementScript = fs.readFileSync(
      path.join(scriptsDir, 'increment-stock.lua'),
      'utf-8',
    );
    const initScript = fs.readFileSync(
      path.join(scriptsDir, 'init-stock.lua'),
      'utf-8',
    );

    // SCRIPT LOAD로 Redis에 등록하고 SHA 해시 저장
    this.scripts.decrementStock = (await this.client.script(
      'LOAD',
      decrementScript,
    )) as string;

    this.scripts.incrementStock = (await this.client.script(
      'LOAD',
      incrementScript,
    )) as string;

    this.scripts.initStock = (await this.client.script(
      'LOAD',
      initScript,
    )) as string;

    this.logger.log('Lua scripts loaded');
  }

  async syncAllStocks(
    // 서버 시작 시 모든 슬롯 재고 동기화
    slots: { id: number; maxCapacity: number; currentCount: number }[],
  ): Promise<void> {
    for (const slot of slots) {
      await this.initStock(slot.id, slot.maxCapacity, slot.currentCount);
    }
    this.logger.log(` ${slots.length} 슬롯 재고를 Redis에 동기화 했습니다.`);
  }

  // 재고 차감 (예약 신청 시)
  async decrementStock(slotId: number): Promise<boolean> {
    const key = this.getStockKey(slotId);
    const startTime = Date.now();

    const result = await this.client.evalsha(
      this.scripts.decrementStock!,
      1,
      key,
    );

    const success = result === 1;
    this.metricsService.recordStockDecrement(
      slotId,
      success,
      Date.now() - startTime,
    );

    return success;
  }

  // 재고 복구 (예약 실패/취소 시)
  async incrementStock(
    slotId: number,
    maxCapacity: number,
    reason: 'cancellation' | 'failure_recovery' = 'failure_recovery',
  ): Promise<number> {
    const key = this.getStockKey(slotId);
    const startTime = Date.now();

    const result = await this.client.evalsha(
      this.scripts.incrementStock!,
      1,
      key,
      maxCapacity,
    );

    this.metricsService.recordStockIncrement(
      slotId,
      reason,
      Date.now() - startTime,
    );

    return result as number;
  }

  // 재고 초기화 (이벤트 생성 또는 서버 시작 시)
  async initStock(
    slotId: number,
    maxCapacity: number,
    currentCount: number,
  ): Promise<number> {
    const key = this.getStockKey(slotId);
    const result = await this.client.evalsha(
      this.scripts.initStock!,
      1,
      key,
      maxCapacity,
      currentCount,
    );
    return result as number;
  }

  // TODO: 현재 재고 조회 (추후 디버깅/모니터링용)
  async getStock(slotId: number): Promise<number> {
    const key = this.getStockKey(slotId);
    const result = await this.client.get(key);
    return result ? parseInt(result, 10) : 0;
  }
}
