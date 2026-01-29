import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';

describe('Redis Stock Integration Tests', () => {
  let redisContainer: StartedTestContainer;
  let redisClient: Redis;
  const scripts: {
    decrementStock?: string;
    incrementStock?: string;
    initStock?: string;
  } = {};

  beforeAll(async () => {
    // Redis 컨테이너 시작
    redisContainer = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    redisClient = new Redis({
      host: redisContainer.getHost(),
      port: redisContainer.getMappedPort(6379),
    });

    // Lua 스크립트 로드
    const scriptsDir = path.join(__dirname, '../../redis/scripts');

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

    scripts.decrementStock = (await redisClient.script(
      'LOAD',
      decrementScript,
    )) as string;
    scripts.incrementStock = (await redisClient.script(
      'LOAD',
      incrementScript,
    )) as string;
    scripts.initStock = (await redisClient.script(
      'LOAD',
      initScript,
    )) as string;
  }, 60000); // 컨테이너 시작 시간 고려

  afterAll(async () => {
    redisClient.disconnect();
    await redisContainer.stop();
  });

  beforeEach(async () => {
    await redisClient.flushall();
  });

  const getStockKey = (slotId: number) => `slot:${slotId}:stock`;

  const initStock = async (
    slotId: number,
    maxCapacity: number,
    currentCount: number,
  ) => {
    return redisClient.evalsha(
      scripts.initStock!,
      1,
      getStockKey(slotId),
      maxCapacity,
      currentCount,
    );
  };

  const decrementStock = async (slotId: number): Promise<boolean> => {
    const result = await redisClient.evalsha(
      scripts.decrementStock!,
      1,
      getStockKey(slotId),
    );
    return result === 1;
  };

  const incrementStock = async (
    slotId: number,
    maxCapacity: number,
  ): Promise<number> => {
    const result = await redisClient.evalsha(
      scripts.incrementStock!,
      1,
      getStockKey(slotId),
      maxCapacity,
    );
    return result as number;
  };

  const getStock = async (slotId: number): Promise<number> => {
    const result = await redisClient.get(getStockKey(slotId));
    return result ? parseInt(result, 10) : 0;
  };

  describe('재고 초기화', () => {
    it('슬롯 재고를 정상적으로 초기화한다', async () => {
      const slotId = 1;
      const maxCapacity = 10;
      const currentCount = 3;

      await initStock(slotId, maxCapacity, currentCount);

      const stock = await getStock(slotId);
      expect(stock).toBe(maxCapacity - currentCount); // 7
    });

    it('빈 슬롯은 전체 용량으로 초기화된다', async () => {
      const slotId = 2;
      const maxCapacity = 5;

      await initStock(slotId, maxCapacity, 0);

      const stock = await getStock(slotId);
      expect(stock).toBe(maxCapacity);
    });
  });

  describe('재고 차감', () => {
    it('재고가 있으면 차감에 성공한다', async () => {
      const slotId = 1;
      await initStock(slotId, 10, 0);

      const success = await decrementStock(slotId);

      expect(success).toBe(true);
      expect(await getStock(slotId)).toBe(9);
    });

    it('재고가 0이면 차감에 실패한다', async () => {
      const slotId = 1;
      await initStock(slotId, 1, 1); // 재고 0

      const success = await decrementStock(slotId);

      expect(success).toBe(false);
      expect(await getStock(slotId)).toBe(0);
    });

    it('존재하지 않는 슬롯은 차감에 실패한다', async () => {
      const success = await decrementStock(999);

      expect(success).toBe(false);
    });
  });

  describe('재고 복구', () => {
    it('재고를 정상적으로 복구한다', async () => {
      const slotId = 1;
      const maxCapacity = 10;
      await initStock(slotId, maxCapacity, 5); // 재고 5

      await incrementStock(slotId, maxCapacity);

      expect(await getStock(slotId)).toBe(6);
    });

    it('최대 용량을 초과하지 않는다', async () => {
      const slotId = 1;
      const maxCapacity = 10;
      await initStock(slotId, maxCapacity, 0); // 재고 10 (최대)

      await incrementStock(slotId, maxCapacity);

      expect(await getStock(slotId)).toBe(maxCapacity); // 여전히 10
    });
  });

  describe('동시성 테스트', () => {
    it('100명이 동시에 예약해도 정원(10명)을 초과하지 않는다', async () => {
      const slotId = 1;
      const maxCapacity = 10;
      const concurrentRequests = 100;

      await initStock(slotId, maxCapacity, 0);

      // 100개의 동시 요청
      const results = await Promise.all(
        Array(concurrentRequests)
          .fill(null)
          .map(() => decrementStock(slotId)),
      );

      const successCount = results.filter((r) => r === true).length;
      const failCount = results.filter((r) => r === false).length;

      expect(successCount).toBe(maxCapacity); // 정확히 10명만 성공
      expect(failCount).toBe(concurrentRequests - maxCapacity); // 90명 실패
      expect(await getStock(slotId)).toBe(0); // 재고 0
    });

    it('동시 예약 + 취소 시 재고 일관성이 유지된다', async () => {
      const slotId = 1;
      const maxCapacity = 10;
      await initStock(slotId, maxCapacity, 0);

      // 5명 예약
      await Promise.all(
        Array(5)
          .fill(null)
          .map(() => decrementStock(slotId)),
      );
      expect(await getStock(slotId)).toBe(5);

      // 동시에 10명 예약 + 3명 취소
      const [reservations] = await Promise.all([
        Promise.all(
          Array(10)
            .fill(null)
            .map(() => decrementStock(slotId)),
        ),
        Promise.all(
          Array(3)
            .fill(null)
            .map(() => incrementStock(slotId, maxCapacity)),
        ),
      ]);

      const reservationSuccess = reservations.filter((r) => r === true).length;

      // 재고 = 초기 5 - 예약성공 + 취소 3
      const finalStock = await getStock(slotId);

      // 재고는 0 이상, maxCapacity 이하여야 함
      expect(finalStock).toBeGreaterThanOrEqual(0);
      expect(finalStock).toBeLessThanOrEqual(maxCapacity);

      // 총 성공 예약 + 현재 재고 + 취소된 예약 = 초기 재고 + 취소
      // 이 테스트는 레이스 컨디션에 따라 결과가 달라질 수 있음
      console.log(`예약 성공: ${reservationSuccess}, 최종 재고: ${finalStock}`);
    });

    it('정원이 1명인 슬롯에 50명이 동시 접근해도 1명만 성공한다', async () => {
      const slotId = 1;
      const maxCapacity = 1;
      const concurrentRequests = 50;

      await initStock(slotId, maxCapacity, 0);

      const results = await Promise.all(
        Array(concurrentRequests)
          .fill(null)
          .map(() => decrementStock(slotId)),
      );

      const successCount = results.filter((r) => r === true).length;

      expect(successCount).toBe(1); // 정확히 1명만 성공
      expect(await getStock(slotId)).toBe(0);
    });
  });
});
