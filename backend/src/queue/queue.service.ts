import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { randomUUID } from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUE_CLEANUP_QUEUE,
  CLEANUP_JOB,
  CleanupJobData,
} from './queue-cleanup-processor';

@Injectable()
export class QueueService {
  constructor(
    private readonly redisService: RedisService,
    @InjectQueue(QUEUE_CLEANUP_QUEUE)
    private cleanupQueue: Queue<CleanupJobData>,
  ) {}

  // 이벤트 시작 시 호출 - 반복 정리 작업 등록
  async startCleanupJob(eventId: number): Promise<void> {
    await this.cleanupQueue.add(
      CLEANUP_JOB,
      { eventId },
      {
        repeat: {
          every: 30000, // 30초마다
        },
        jobId: `cleanup-event-${eventId}`, // 중복 방지
      },
    );
  }

  // 이벤트 종료 시 호출 - 반복 작업 제거
  async stopCleanupJob(eventId: number): Promise<void> {
    // 반복 작업 목록에서 해당 이벤트의 작업 찾아서 제거
    const repeatableJobs = await this.cleanupQueue.getRepeatableJobs();

    for (const job of repeatableJobs) {
      if (job.name === CLEANUP_JOB && job.id === `cleanup-event-${eventId}`) {
        await this.cleanupQueue.removeRepeatableByKey(job.key);
        break;
      }
    }
  }
  // TTL
  private readonly USER_STATUS_TTL = 60;
  private readonly TOKEN_TTL = 300; // 토큰 유효
  private readonly BATCH_SIZE = 100; // 동시 처리 가능 인원

  private getQueueKey(eventId: number): string {
    return `event:${eventId}:queue`;
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
  ): Promise<{
    position: number;
    isNew: boolean;
  }> {
    const client = this.redisService.getClient();
    const queueKey = this.getQueueKey(eventId);
    const statusKey = this.getUserStatusKey(eventId, userId);

    // 대기열 확인 (이미 대기열에 존재하는지)
    const existingStatus = await client.hgetall(statusKey);

    if (existingStatus && existingStatus.sessionId) {
      // 이미 있음 - 세션 교체, 순번 유지
      await client.hset(statusKey, 'sessionId', sessionId);
      await client.expire(statusKey, this.USER_STATUS_TTL);

      const position = await client.zrank(queueKey, userId);
      return {
        position: position ?? 0,
        isNew: false,
      };
    }

    // Sorted Set
    const now = Date.now();

    // Sorted Set에 추가
    await client.zadd(queueKey, now, userId);

    // 상태 Hash 생성
    await client.hset(statusKey, 'sessionId', sessionId);
    await client.hset(statusKey, 'enteredAt', now.toString());
    await client.expire(statusKey, this.USER_STATUS_TTL);

    // 현재 순번 조회
    const position = await client.zrank(queueKey, userId);

    return {
      position: position ?? 0,
      isNew: true,
    };
  }

  // 대기열 상태 조회 (순번 + 전체 인원 + 토큰 여부)
  async getQueueStatus(
    eventId: number,
    userId: string,
  ): Promise<{
    position: number | null;
    totalWaiting: number;
    hasToken: boolean;
    token?: string; // 토큰 발급 시 함께 반환
  }> {
    const client = this.redisService.getClient();
    const queueKey = this.getQueueKey(eventId);
    const tokenKey = this.getTokenKey(eventId, userId);
    const statusKey = this.getUserStatusKey(eventId, userId);

    // 이미 토큰이 있는지 확인
    const existingToken = await client.get(tokenKey);
    if (existingToken) {
      return {
        position: null,
        totalWaiting: await client.zcard(queueKey),
        hasToken: true,
        token: existingToken,
      };
    }

    //  현재 순번 조회
    const position = await client.zrank(queueKey, userId);
    const totalWaiting = await client.zcard(queueKey);

    //  순번이 BATCH_SIZE 이내면 토큰 발급
    if (position !== null && position < this.BATCH_SIZE) {
      const token = await this.issueToken(eventId, userId);
      return {
        position: null,
        totalWaiting,
        hasToken: true,
        token,
      };
    }

    // 아직 순번 아님 - Heartbeat 갱신
    if (position !== null) {
      await client.expire(statusKey, this.USER_STATUS_TTL);
    }

    return {
      position,
      totalWaiting,
      hasToken: false,
    };
  }

  // 토큰 발급
  async issueToken(eventId: number, userId: string): Promise<string> {
    const client = this.redisService.getClient();
    const tokenKey = this.getTokenKey(eventId, userId);
    const queueKey = this.getQueueKey(eventId);

    // 이미 토큰이 있는지 확인
    const existingToken = await client.get(tokenKey);
    if (existingToken) {
      return existingToken;
    }

    // 새 토큰 생성
    const token = randomUUID();

    // 토큰 저장 (TTL 설정)
    await client.setex(tokenKey, this.TOKEN_TTL, token);

    // 대기열에서 제거
    await client.zrem(queueKey, userId);

    return token;
  }

  async hasValidToken(eventId: number, userId: string): Promise<boolean> {
    const client = this.redisService.getClient();
    const tokenKey = this.getTokenKey(eventId, userId);

    const token = await client.get(tokenKey);
    return token !== null;
  }

  // 토큰 무효화 (예약 성공 후)
  async invalidateToken(eventId: number, userId: string): Promise<void> {
    const client = this.redisService.getClient();
    const tokenKey = this.getTokenKey(eventId, userId);
    const statusKey = this.getUserStatusKey(eventId, userId);

    await client.del(tokenKey);
    await client.del(statusKey);
  }

  // 비활성 사용자 정리 (BullMQ Job에서 호출)
  async cleanupInactiveUsers(eventId: number): Promise<number> {
    const client = this.redisService.getClient();
    const queueKey = this.getQueueKey(eventId);

    // 대기열의 모든 사용자 조회
    const members = await client.zrange(queueKey, 0, -1);
    let removedCount = 0;

    for (const userId of members) {
      const statusKey = this.getUserStatusKey(eventId, userId);
      const exists = await client.exists(statusKey);

      // status 키가 만료되었으면 (heartbeat 없음) 대기열에서 제거
      if (exists === 0) {
        await client.zrem(queueKey, userId);
        removedCount++;
      }
    }

    return removedCount;
  }
}
