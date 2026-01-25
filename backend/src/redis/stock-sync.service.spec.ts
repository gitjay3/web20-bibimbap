import { Test, TestingModule } from '@nestjs/testing';
import { StockSyncService } from './stock-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from './redis.service';

const createPrismaMock = () => ({
  eventSlot: {
    findMany: jest.fn(),
  },
});

const createRedisServiceMock = () => ({
  syncAllStocks: jest.fn(),
});

describe('StockSyncService', () => {
  let service: StockSyncService;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let redisMock: ReturnType<typeof createRedisServiceMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    redisMock = createRedisServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockSyncService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    service = module.get<StockSyncService>(StockSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncAllStocks', () => {
    it('DB에서 슬롯을 조회하고 Redis에 동기화한다', async () => {
      const mockSlots = [
        { id: 1, maxCapacity: 10, currentCount: 2 },
        { id: 2, maxCapacity: 20, currentCount: 5 },
      ];
      prismaMock.eventSlot.findMany.mockResolvedValue(mockSlots);

      await service.syncAllStocks();

      expect(prismaMock.eventSlot.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          maxCapacity: true,
          currentCount: true,
        },
      });
      expect(redisMock.syncAllStocks).toHaveBeenCalledWith(mockSlots);
    });

    it('슬롯이 없어도 에러 없이 처리한다', async () => {
      prismaMock.eventSlot.findMany.mockResolvedValue([]);

      await service.syncAllStocks();

      expect(redisMock.syncAllStocks).toHaveBeenCalledWith([]);
    });
  });
});
