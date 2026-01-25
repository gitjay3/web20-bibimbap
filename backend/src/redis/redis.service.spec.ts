import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { MetricsService } from '../metrics/metrics.service';

// Mock Redis client instance - 전역 변수로 선언해야 jest.mock에서 참조 가능
const mockOn = jest.fn();
const mockDisconnect = jest.fn();
const mockScript = jest.fn().mockResolvedValue('sha-hash');
const mockEvalsha = jest.fn();
const mockGet = jest.fn();

// ioredis mock
jest.mock('ioredis', () => {
  return function MockRedis() {
    return {
      on: mockOn,
      disconnect: mockDisconnect,
      script: mockScript,
      evalsha: mockEvalsha,
      get: mockGet,
    };
  };
});

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('-- lua script'),
}));

const createConfigServiceMock = () => ({
  get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      REDIS_PASSWORD: undefined,
    };
    return config[key] ?? defaultValue;
  }),
});

const createMetricsMock = () => ({
  recordStockDecrement: jest.fn(),
  recordStockIncrement: jest.fn(),
});

describe('RedisService', () => {
  let service: RedisService;
  let metricsMock: ReturnType<typeof createMetricsMock>;

  beforeEach(async () => {
    jest.clearAllMocks();
    metricsMock = createMetricsMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: ConfigService, useValue: createConfigServiceMock() },
        { provide: MetricsService, useValue: metricsMock },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStockKey', () => {
    it('올바른 키 형식을 반환한다', () => {
      const key = service.getStockKey(123);
      expect(key).toBe('slot:123:stock');
    });
  });

  describe('getClient', () => {
    it('Redis 클라이언트를 반환한다', () => {
      const client = service.getClient();
      expect(client).toBeDefined();
    });
  });

  describe('decrementStock', () => {
    it('재고 차감 성공 시 true를 반환한다', async () => {
      mockEvalsha.mockResolvedValue(1);

      const result = await service.decrementStock(1);

      expect(result).toBe(true);
      expect(metricsMock.recordStockDecrement).toHaveBeenCalledWith(
        1,
        true,
        expect.any(Number),
      );
    });

    it('재고 차감 실패 시 false를 반환한다', async () => {
      mockEvalsha.mockResolvedValue(0);

      const result = await service.decrementStock(1);

      expect(result).toBe(false);
      expect(metricsMock.recordStockDecrement).toHaveBeenCalledWith(
        1,
        false,
        expect.any(Number),
      );
    });
  });

  describe('incrementStock', () => {
    it('재고를 복구하고 새 재고량을 반환한다', async () => {
      mockEvalsha.mockResolvedValue(5);

      const result = await service.incrementStock(1, 10, 'cancellation');

      expect(result).toBe(5);
      expect(metricsMock.recordStockIncrement).toHaveBeenCalledWith(
        1,
        'cancellation',
        expect.any(Number),
      );
    });
  });

  describe('initStock', () => {
    it('재고를 초기화한다', async () => {
      mockEvalsha.mockResolvedValue(8);

      const result = await service.initStock(1, 10, 2);

      expect(result).toBe(8);
    });
  });

  describe('getStock', () => {
    it('현재 재고를 반환한다', async () => {
      mockGet.mockResolvedValue('5');

      const result = await service.getStock(1);

      expect(result).toBe(5);
    });

    it('재고가 없으면 0을 반환한다', async () => {
      mockGet.mockResolvedValue(null);

      const result = await service.getStock(1);

      expect(result).toBe(0);
    });
  });

  describe('syncAllStocks', () => {
    it('모든 슬롯 재고를 동기화한다', async () => {
      const slots = [
        { id: 1, maxCapacity: 10, currentCount: 2 },
        { id: 2, maxCapacity: 20, currentCount: 5 },
      ];

      mockEvalsha.mockResolvedValue(8);

      await service.syncAllStocks(slots);

      // beforeEach에서 onModuleInit으로 3번 호출 + syncAllStocks에서 2번 = 5번
      expect(mockEvalsha).toHaveBeenCalled();
    });
  });
});
