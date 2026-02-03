import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventSlotsService } from './event-slots.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { createPrismaMock } from '../test/mocks/prisma.mock';

const createRedisMock = () => ({
  initStock: jest.fn().mockResolvedValue(undefined),
});

describe('EventSlotsService', () => {
  let service: EventSlotsService;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let redisMock: ReturnType<typeof createRedisMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    redisMock = createRedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventSlotsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    service = module.get<EventSlotsService>(EventSlotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEventWithAvailability', () => {
    it('이벤트의 슬롯 가용성을 반환한다', async () => {
      const mockEvent = {
        id: 1,
        title: 'Test Event',
        slots: [
          // 이미 있음 - 문제 없어 보임
          { id: 1, maxCapacity: 10, currentCount: 5, extraInfo: {} },
          { id: 2, maxCapacity: 20, currentCount: 20, extraInfo: {} },
        ],
      };

      // 추가: event mock
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findByEventWithAvailability(1);

      expect(result).toEqual({
        eventId: 1,
        eventTitle: 'Test Event',
        slots: [
          {
            id: 1,
            maxCapacity: 10,
            currentCount: 5,
            remainingSeats: 5,
            isAvailable: true,
            extraInfo: {},
          },
          {
            id: 2,
            maxCapacity: 20,
            currentCount: 20,
            remainingSeats: 0,
            isAvailable: false,
            extraInfo: {},
          },
        ],
      });
    });

    it('이벤트가 없으면 NotFoundException을 던진다', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(service.findByEventWithAvailability(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByEventWithAvailability(999)).rejects.toThrow(
        '일정을 찾을 수 없습니다',
      );
    });

    it('currentCount가 maxCapacity보다 크면 remainingSeats는 0이다', async () => {
      const mockEvent = {
        id: 1,
        title: 'Test Event',
        slots: [{ id: 1, maxCapacity: 10, currentCount: 15, extraInfo: {} }],
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findByEventWithAvailability(1);

      expect(result.slots[0].remainingSeats).toBe(0);
      expect(result.slots[0].isAvailable).toBe(false);
    });
  });

  describe('getAvailabilityByEvent', () => {
    it('이벤트의 슬롯 가용성을 반환한다', async () => {
      const mockEvent = {
        applicationUnit: 'INDIVIDUAL',
        organizationId: 1,
        slots: [
          { id: 1, currentCount: 5, maxCapacity: 10, reservations: [] },
          { id: 2, currentCount: 10, maxCapacity: 10, reservations: [] },
        ],
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.getAvailabilityByEvent(1);

      expect(result.slots).toEqual([
        {
          slotId: 1,
          currentCount: 5,
          remainingSeats: 5,
          isAvailable: true,
          reservations: [],
        },
        {
          slotId: 2,
          currentCount: 10,
          remainingSeats: 0,
          isAvailable: false,
          reservations: [],
        },
      ]);
      expect(result.timestamp).toBeDefined();
    });

    it('이벤트가 없으면 NotFoundException을 던진다', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(service.getAvailabilityByEvent(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getAvailabilityByEvent(999)).rejects.toThrow(
        '이벤트를 찾을 수 없습니다',
      );
    });

    it('슬롯이 없으면 NotFoundException을 던진다', async () => {
      const mockEvent = {
        applicationUnit: 'INDIVIDUAL',
        organizationId: 1,
        slots: [],
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent);

      await expect(service.getAvailabilityByEvent(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getAvailabilityByEvent(999)).rejects.toThrow(
        '해당 이벤트의 슬롯을 찾을 수 없습니다',
      );
    });
  });

  describe('getAvailability', () => {
    it('슬롯 ID 배열로 가용성을 조회한다', async () => {
      const mockSlots = [
        { id: 1, currentCount: 3, maxCapacity: 10, reservations: [] },
        { id: 2, currentCount: 8, maxCapacity: 8, reservations: [] },
      ];

      prismaMock.eventSlot.findMany.mockResolvedValue(mockSlots);

      const result = await service.getAvailability([1, 2]);

      expect(result.slots).toEqual([
        {
          slotId: 1,
          currentCount: 3,
          remainingSeats: 7,
          isAvailable: true,
          reservations: [],
        },
        {
          slotId: 2,
          currentCount: 8,
          remainingSeats: 0,
          isAvailable: false,
          reservations: [],
        },
      ]);
      expect(result.timestamp).toBeDefined();
    });

    it('빈 배열이면 빈 슬롯 목록을 반환한다', async () => {
      prismaMock.eventSlot.findMany.mockResolvedValue([]);

      const result = await service.getAvailability([]);

      expect(result.slots).toEqual([]);
      expect(result.timestamp).toBeDefined();
    });

    it('존재하지 않는 슬롯 ID는 결과에 포함되지 않는다', async () => {
      prismaMock.eventSlot.findMany.mockResolvedValue([
        { id: 1, currentCount: 5, maxCapacity: 10, reservations: [] },
      ]);

      const result = await service.getAvailability([1, 999]);

      expect(result.slots).toHaveLength(1);
      expect(result.slots[0].slotId).toBe(1);
    });
  });
});
