import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { randomUUID } from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CleanupJobData, QUEUE_CLEANUP_QUEUE } from './queue.constants';
import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenTrackException } from '../../common/exceptions/api.exception';
import { isUserEligibleForTrack } from '../../common/utils/track.util';

@Injectable()
export class QueueService {
  constructor(
    private readonly redisService: RedisService,
    private readonly metricsService: MetricsService,
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_CLEANUP_QUEUE)
    private cleanupQueue: Queue<CleanupJobData>,
  ) {}

  // TTL (seconds)
  private readonly HEARTBEAT_TTL = 60;
  private readonly USER_STATUS_TTL = 60;
  private readonly TOKEN_TTL = 300; // 토큰 유효
  private readonly BATCH_SIZE = 100; // 동시 처리 가능 인원
  private readonly MAX_TOKEN_RETRY = 3; // 토큰 발급 최대 재시도 횟수

  private getQueueKey(eventId: number): string {
    return `event:${eventId}:queue`;
  }

  private getHeartbeatKey(eventId: number): string {
    return `event:${eventId}:heartbeat`;
  }

  private getUserStatusKey(eventId: number, userId: string): string {
    return `event:${eventId}:user:${userId}:status`;
  }

  private getTokenKey(eventId: number, userId: string): string {
    return `event:${eventId}:user:${userId}:token`;
  }

  // 대기열 진입
  async enterQueue(
    eventId: number,
    userId: string,
    sessionId: string,
  ): Promise<{ position: number; isNew: boolean }> {
    // 트랙 검증
    await this.validateTrackOrThrow(eventId, userId);

    const client = this.redisService.getClient();
    const queueKey = this.getQueueKey(eventId);
    const statusKey = this.getUserStatusKey(eventId, userId);
    const heartbeatKey = this.getHeartbeatKey(eventId);

    const now = Date.now();

    // 대기열 확인 (이미 대기열에 존재하는지)
    const existingSessionId = await client.hget(statusKey, 'sessionId');

    if (existingSessionId) {
      // TODO: 단일 세션 정책
      // - existingSessionId !== sessionId 인 경우

      // 이미 있음 - 세션 교체, 순번 유지
      await client.hset(statusKey, 'sessionId', sessionId);
      await client.expire(statusKey, this.USER_STATUS_TTL);

      // heartbeat 갱신
      await client.zadd(heartbeatKey, now, userId);

      const position = await client.zrank(queueKey, userId);

      // 메트릭: 기존 사용자 재진입
      this.metricsService.recordQueueEntry(eventId, false);

      return {
        position: position ?? 0,
        isNew: false,
      };
    }

    // 신규 진입
    await client.zadd(queueKey, now, userId);

    // 상태 저장 + TTL
    await client.hset(statusKey, 'sessionId', sessionId);
    await client.hset(statusKey, 'enteredAt', String(now));
    await client.expire(statusKey, this.USER_STATUS_TTL);

    // heartbeat 기록
    await client.zadd(heartbeatKey, now, userId);

    const position = await client.zrank(queueKey, userId);

    // 메트릭: 신규 사용자 진입
    this.metricsService.recordQueueEntry(eventId, true);

    // 대기열 인원 업데이트
    const totalWaiting = await client.zcard(queueKey);
    this.metricsService.updateQueueStatus(eventId, totalWaiting);

    return {
      position: position ?? 0,
      isNew: true,
    };
  }

  // 대기열 상태 조회: 토큰 확인 → 순번 확인 → heartbeat 갱신 → batch 이내면 토큰 발급
  async getQueueStatus(
    eventId: number,
    userId: string,
  ): Promise<{
    position: number | null;
    totalWaiting: number;
    hasToken: boolean;
    tokenExpiresAt?: number;
  }> {
    const client = this.redisService.getClient();
    const queueKey = this.getQueueKey(eventId);
    const heartbeatKey = this.getHeartbeatKey(eventId);
    const tokenKey = this.getTokenKey(eventId, userId);

    // 이미 토큰이 있는지 확인
    const existingToken = await client.get(tokenKey);
    if (existingToken) {
      const ttl = await client.ttl(tokenKey);
      return {
        position: null,
        totalWaiting: await client.zcard(queueKey),
        hasToken: true,
        tokenExpiresAt: Date.now() + Math.max(ttl, 0) * 1000,
      };
    }

    // 현재 순번/대기 인원
    const [position, totalWaiting] = await Promise.all([
      client.zrank(queueKey, userId),
      client.zcard(queueKey),
    ]);

    // 대기열에 없으면 그대로 반환
    if (position === null) {
      return { position: null, totalWaiting, hasToken: false };
    }

    // heartbeat 갱신
    await client.zadd(heartbeatKey, Date.now(), userId);

    // 순번이 batch 이내면 토큰 발급
    if (position < this.BATCH_SIZE) {
      await this.issueToken(eventId, userId);
      return {
        position: null,
        totalWaiting,
        hasToken: true,
        tokenExpiresAt: Date.now() + this.TOKEN_TTL * 1000,
      };
    }

    return { position, totalWaiting, hasToken: false };
  }

  // 토큰 발급
  async issueToken(
    eventId: number,
    userId: string,
    retryCount = 0,
  ): Promise<string> {
    const client = this.redisService.getClient();
    const tokenKey = this.getTokenKey(eventId, userId);
    const queueKey = this.getQueueKey(eventId);
    const heartbeatKey = this.getHeartbeatKey(eventId);

    // 새 토큰 생성
    const token = randomUUID();

    // 토큰 저장 (TTL 설정)
    const setResult = await client.set(
      tokenKey,
      token,
      'EX',
      this.TOKEN_TTL,
      'NX',
    );

    if (setResult === 'OK') {
      // 최초 발급 성공 → 대기열에서 제거
      await client.zrem(queueKey, userId);
      await client.zrem(heartbeatKey, userId);

      this.metricsService.recordTokenIssued(eventId);
      const totalWaiting = await client.zcard(queueKey);
      this.metricsService.updateQueueStatus(eventId, totalWaiting);

      return token;
    }

    // SET NX 실패 → 이미 토큰이 있음 → 기존 토큰 반환
    const existingToken = await client.get(tokenKey);
    if (existingToken) {
      return existingToken;
    }

    // 토큰이 그 사이에 만료됨 → 재시도 (최대 횟수 제한)
    if (retryCount >= this.MAX_TOKEN_RETRY) {
      throw new Error(
        `토큰 발급 실패: 최대 재시도 횟수(${this.MAX_TOKEN_RETRY}) 초과`,
      );
    }
    return this.issueToken(eventId, userId, retryCount + 1);
  }

  async hasValidToken(eventId: number, userId: string): Promise<boolean> {
    const client = this.redisService.getClient();
    const tokenKey = this.getTokenKey(eventId, userId);
    return (await client.get(tokenKey)) !== null;
  }

  // TODO: 토큰 무효화 (예약 성공 후)
  async invalidateToken(eventId: number, userId: string): Promise<void> {
    const client = this.redisService.getClient();
    const tokenKey = this.getTokenKey(eventId, userId);
    await client.del(tokenKey);
  }

  // 만료된 유저 정리 (heartbeat 기준)
  async cleanupExpiredUsers(eventId: number): Promise<number> {
    const client = this.redisService.getClient();
    const queueKey = this.getQueueKey(eventId);
    const heartbeatKey = this.getHeartbeatKey(eventId);

    const now = Date.now();
    const threshold = now - this.HEARTBEAT_TTL * 1000;

    // 만료된 유저 목록만 조회
    const expiredUserIds: string[] = await client.zrangebyscore(
      heartbeatKey,
      0,
      threshold,
    );
    if (expiredUserIds.length === 0) return 0;

    const pipeline = client.pipeline();

    // heartbeat/queue 제거
    pipeline.zrem(heartbeatKey, ...expiredUserIds);
    pipeline.zrem(queueKey, ...expiredUserIds);

    // statusKey 제거
    for (const userId of expiredUserIds) {
      pipeline.del(this.getUserStatusKey(eventId, userId));
    }

    await pipeline.exec();
    return expiredUserIds.length;
  }

  // 트랙 검증: COMMON이 아닌 이벤트는 해당 트랙 캠퍼만 진입 가능
  private async validateTrackOrThrow(
    eventId: number,
    userId: string,
  ): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { track: true, organizationId: true },
    });

    if (!event) return;

    const eligible = await isUserEligibleForTrack(
      this.prisma,
      userId,
      event.track,
      event.organizationId,
    );
    if (!eligible) {
      throw new ForbiddenTrackException();
    }
  }
}
