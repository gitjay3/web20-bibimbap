import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { RedisService } from '../redis/redis.service';
import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_CLEANUP_QUEUE } from './queue.constants';
import { ForbiddenTrackException } from '../../common/exceptions/api.exception';

const createRedisMock = () => {
  const clientMock = {
    hget: jest.fn(),
    hset: jest.fn(),
    expire: jest.fn(),
    zadd: jest.fn(),
    zrank: jest.fn(),
    zcard: jest.fn(),
    zrem: jest.fn(),
    zrangebyscore: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
    pipeline: jest.fn().mockReturnValue({
      zrem: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
  };

  return {
    getClient: jest.fn().mockReturnValue(clientMock),
    clientMock,
  };
};

const createMetricsMock = () => ({
  recordQueueEntry: jest.fn(),
  recordTokenIssued: jest.fn(),
  updateQueueStatus: jest.fn(),
});

const createCleanupQueueMock = () => ({
  add: jest.fn(),
});

const createPrismaMock = () => ({
  event: {
    findUnique: jest.fn(),
  },
  camperPreRegistration: {
    findFirst: jest.fn(),
  },
});

describe('QueueService', () => {
  let service: QueueService;
  let redisMock: ReturnType<typeof createRedisMock>;
  let metricsMock: ReturnType<typeof createMetricsMock>;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    redisMock = createRedisMock();
    metricsMock = createMetricsMock();
    prismaMock = createPrismaMock();

    // 기본값: COMMON 트랙 이벤트 (모든 사용자 허용)
    prismaMock.event.findUnique.mockResolvedValue({
      track: 'COMMON',
      organizationId: 1,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: RedisService, useValue: redisMock },
        { provide: MetricsService, useValue: metricsMock },
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: getQueueToken(QUEUE_CLEANUP_QUEUE),
          useValue: createCleanupQueueMock(),
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enterQueue', () => {
    const eventId = 1;
    const userId = 'user-123';
    const sessionId = 'session-456';

    it('신규 사용자를 대기열에 추가한다', async () => {
      const { clientMock } = redisMock;
      clientMock.hget.mockResolvedValue(null); // 기존 세션 없음
      clientMock.zrank.mockResolvedValue(5);
      clientMock.zcard.mockResolvedValue(10);

      const result = await service.enterQueue(eventId, userId, sessionId);

      expect(result).toEqual({ position: 5, isNew: true });
      expect(clientMock.zadd).toHaveBeenCalled();
      expect(clientMock.hset).toHaveBeenCalledWith(
        expect.stringContaining('status'),
        'sessionId',
        sessionId,
      );
      expect(metricsMock.recordQueueEntry).toHaveBeenCalledWith(eventId, true);
    });

    it('기존 사용자는 세션을 교체하고 순번을 유지한다', async () => {
      const { clientMock } = redisMock;
      clientMock.hget.mockResolvedValue('old-session'); // 기존 세션 있음
      clientMock.zrank.mockResolvedValue(3);

      const result = await service.enterQueue(eventId, userId, sessionId);

      expect(result).toEqual({ position: 3, isNew: false });
      expect(metricsMock.recordQueueEntry).toHaveBeenCalledWith(eventId, false);
    });

    it('트랙이 일치하는 사용자는 대기열에 진입할 수 있다', async () => {
      const { clientMock } = redisMock;
      clientMock.hget.mockResolvedValue(null);
      clientMock.zrank.mockResolvedValue(0);
      clientMock.zcard.mockResolvedValue(1);

      // WEB 전용 이벤트
      prismaMock.event.findUnique.mockResolvedValue({
        track: 'WEB',
        organizationId: 1,
      });
      // 사용자도 WEB 트랙
      prismaMock.camperPreRegistration.findFirst.mockResolvedValue({
        track: 'WEB',
      });

      const result = await service.enterQueue(eventId, userId, sessionId);

      expect(result.isNew).toBe(true);
    });

    it('트랙이 불일치하면 ForbiddenTrackException이 발생한다', async () => {
      // ANDROID 전용 이벤트
      prismaMock.event.findUnique.mockResolvedValue({
        track: 'ANDROID',
        organizationId: 1,
      });
      // 사용자는 WEB 트랙
      prismaMock.camperPreRegistration.findFirst.mockResolvedValue({
        track: 'WEB',
      });

      await expect(
        service.enterQueue(eventId, userId, sessionId),
      ).rejects.toThrow(ForbiddenTrackException);
    });

    it('사전등록이 없으면 ForbiddenTrackException이 발생한다', async () => {
      // ANDROID 전용 이벤트
      prismaMock.event.findUnique.mockResolvedValue({
        track: 'ANDROID',
        organizationId: 1,
      });
      // 사전등록 없음
      prismaMock.camperPreRegistration.findFirst.mockResolvedValue(null);

      await expect(
        service.enterQueue(eventId, userId, sessionId),
      ).rejects.toThrow(ForbiddenTrackException);
    });
  });

  describe('getQueueStatus', () => {
    const eventId = 1;
    const userId = 'user-123';

    it('토큰이 있으면 토큰 정보를 반환한다', async () => {
      const { clientMock } = redisMock;
      clientMock.get.mockResolvedValue('existing-token');
      clientMock.ttl.mockResolvedValue(250);
      clientMock.zcard.mockResolvedValue(10);

      const result = await service.getQueueStatus(eventId, userId);

      expect(result.hasToken).toBe(true);
      expect(result.position).toBeNull();
      expect(result.tokenExpiresAt).toBeDefined();
    });

    it('대기열에 없으면 position null을 반환한다', async () => {
      const { clientMock } = redisMock;
      clientMock.get.mockResolvedValue(null); // 토큰 없음
      clientMock.zrank.mockResolvedValue(null); // 대기열에 없음
      clientMock.zcard.mockResolvedValue(10);

      const result = await service.getQueueStatus(eventId, userId);

      expect(result.position).toBeNull();
      expect(result.hasToken).toBe(false);
    });

    it('순번이 100 이내면 토큰을 발급한다', async () => {
      const { clientMock } = redisMock;
      clientMock.get.mockResolvedValueOnce(null); // 기존 토큰 없음
      clientMock.zrank.mockResolvedValue(50); // 100 미만
      clientMock.zcard.mockResolvedValue(100);
      clientMock.get.mockResolvedValueOnce(null); // issueToken 내부 체크
      clientMock.set.mockResolvedValue('OK');

      const result = await service.getQueueStatus(eventId, userId);

      expect(result.hasToken).toBe(true);
      expect(metricsMock.recordTokenIssued).toHaveBeenCalled();
    });

    it('순번이 100 이상이면 대기열 정보를 반환한다', async () => {
      const { clientMock } = redisMock;
      clientMock.get.mockResolvedValue(null); // 토큰 없음
      clientMock.zrank.mockResolvedValue(150); // 100 이상
      clientMock.zcard.mockResolvedValue(200);

      const result = await service.getQueueStatus(eventId, userId);

      expect(result.position).toBe(150);
      expect(result.hasToken).toBe(false);
    });
  });

  describe('issueToken', () => {
    const eventId = 1;
    const userId = 'user-123';

    it('새 토큰을 발급하고 대기열에서 제거한다', async () => {
      const { clientMock } = redisMock;
      clientMock.get.mockResolvedValue(null);
      clientMock.set.mockResolvedValue('OK');
      clientMock.zcard.mockResolvedValue(9);

      const token = await service.issueToken(eventId, userId);

      expect(token).toBeDefined();
      expect(clientMock.set).toHaveBeenCalledWith(
        expect.stringContaining('token'),
        expect.any(String),
        'EX',
        300,
        'NX',
      );
      expect(clientMock.zrem).toHaveBeenCalled();
      expect(metricsMock.recordTokenIssued).toHaveBeenCalledWith(eventId);
    });

    it('기존 토큰이 있으면 그 토큰을 반환한다', async () => {
      const { clientMock } = redisMock;
      clientMock.set.mockResolvedValue(null);
      clientMock.get.mockResolvedValue('existing-token');

      const token = await service.issueToken(eventId, userId);

      expect(token).toBe('existing-token');
      expect(clientMock.set).toHaveBeenCalled(); // set은 호출됨 (NX로 실패)
      expect(clientMock.get).toHaveBeenCalled(); // 기존 토큰 조회
    });
  });

  describe('hasValidToken', () => {
    it('토큰이 있으면 true를 반환한다', async () => {
      const { clientMock } = redisMock;
      clientMock.get.mockResolvedValue('valid-token');

      const result = await service.hasValidToken(1, 'user-123');

      expect(result).toBe(true);
    });

    it('토큰이 없으면 false를 반환한다', async () => {
      const { clientMock } = redisMock;
      clientMock.get.mockResolvedValue(null);

      const result = await service.hasValidToken(1, 'user-123');

      expect(result).toBe(false);
    });
  });

  describe('invalidateToken', () => {
    it('토큰을 삭제한다', async () => {
      const { clientMock } = redisMock;

      await service.invalidateToken(1, 'user-123');

      expect(clientMock.del).toHaveBeenCalledWith(
        expect.stringContaining('token'),
      );
    });
  });

  describe('cleanupExpiredUsers', () => {
    it('만료된 사용자를 정리한다', async () => {
      const { clientMock } = redisMock;
      clientMock.zrangebyscore.mockResolvedValue(['user-1', 'user-2']);

      const count = await service.cleanupExpiredUsers(1);

      expect(count).toBe(2);
    });

    it('만료된 사용자가 없으면 0을 반환한다', async () => {
      const { clientMock } = redisMock;
      clientMock.zrangebyscore.mockResolvedValue([]);

      const count = await service.cleanupExpiredUsers(1);

      expect(count).toBe(0);
    });
  });
});
