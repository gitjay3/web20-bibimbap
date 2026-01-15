import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { createPrismaMock, createTxMock } from '../test/mocks/prisma.mock';
import { RESERVATION_QUEUE } from './dto/reservation-job.dto';
import {
  SlotNotFoundException,
  SlotFullException,
  ReservationNotFoundException,
  AlreadyCancelledException,
  UnauthorizedReservationException,
} from '../../common/exceptions/api.exception';
import type { ApplyReservationDto } from './dto/apply-reservation.dto';

const createRedisMock = () => ({
  initStock: jest.fn().mockResolvedValue(undefined),
  decrementStock: jest.fn().mockResolvedValue(true),
  incrementStock: jest.fn().mockResolvedValue(undefined),
});

const createQueueMock = () => ({
  add: jest.fn().mockResolvedValue({ id: 'job-123' }),
});

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let redisMock: ReturnType<typeof createRedisMock>;
  let queueMock: ReturnType<typeof createQueueMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    redisMock = createRedisMock();
    queueMock = createQueueMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
        { provide: getQueueToken(RESERVATION_QUEUE), useValue: queueMock },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('apply', () => {
    const userId = 'user-123';
    const dto: ApplyReservationDto = { slotId: 1 };

    it('예약을 큐에 성공적으로 등록한다', async () => {
      const mockSlot = {
        id: 1,
        currentCount: 5,
        maxCapacity: 10,
      };

      prismaMock.eventSlot.findUnique.mockResolvedValue(mockSlot);
      redisMock.decrementStock.mockResolvedValue(true);

      const result = await service.apply(userId, dto);

      expect(result).toEqual({
        status: 'PENDING',
        message: '예약이 접수되었습니다. 잠시 후 확정됩니다.',
      });
      expect(redisMock.decrementStock).toHaveBeenCalledWith(dto.slotId);
      expect(queueMock.add).toHaveBeenCalled();
    });

    it('슬롯이 존재하지 않으면 SlotNotFoundException을 던진다', async () => {
      prismaMock.eventSlot.findUnique.mockResolvedValue(null);

      await expect(service.apply(userId, dto)).rejects.toThrow(
        SlotNotFoundException,
      );
    });

    it('Redis 재고가 없으면 SlotFullException을 던진다', async () => {
      const mockSlot = {
        id: 1,
        currentCount: 10,
        maxCapacity: 10,
      };

      prismaMock.eventSlot.findUnique.mockResolvedValue(mockSlot);
      redisMock.decrementStock.mockResolvedValue(false);

      await expect(service.apply(userId, dto)).rejects.toThrow(
        SlotFullException,
      );
    });
  });

  describe('cancel', () => {
    const userId = 'user-123';

    it('예약을 성공적으로 취소한다', async () => {
      const txMock = createTxMock();
      const reservationId = 1;
      const mockSlot = { id: 1, maxCapacity: 10, version: 1 };
      const mockReservation = {
        id: reservationId,
        userId,
        slotId: 1,
        status: 'CONFIRMED',
        slot: mockSlot,
      };
      const updatedReservation = {
        id: reservationId,
        userId,
        slotId: 1,
        status: 'CANCELLED',
      };

      txMock.reservation.findUnique.mockResolvedValue(mockReservation);
      txMock.reservation.update.mockResolvedValue(updatedReservation);
      txMock.eventSlot.updateMany.mockResolvedValue({ count: 1 });

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: typeof txMock) => Promise<unknown>) =>
          callback(txMock),
      );

      const result = await service.cancel(reservationId, userId);

      expect(result.status).toBe('CANCELLED');
      expect(redisMock.incrementStock).toHaveBeenCalledWith(
        mockReservation.slotId,
        mockSlot.maxCapacity,
      );
    });

    it('예약이 존재하지 않으면 ReservationNotFoundException을 던진다', async () => {
      const txMock = createTxMock();
      txMock.reservation.findUnique.mockResolvedValue(null);

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: typeof txMock) => Promise<unknown>) =>
          callback(txMock),
      );

      await expect(service.cancel(999, userId)).rejects.toThrow(
        ReservationNotFoundException,
      );
    });

    it('다른 사용자의 예약이면 UnauthorizedReservationException을 던진다', async () => {
      const txMock = createTxMock();
      const mockReservation = {
        id: 1,
        userId: 'other-user',
        slotId: 1,
        status: 'CONFIRMED',
      };

      txMock.reservation.findUnique.mockResolvedValue(mockReservation);

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: typeof txMock) => Promise<unknown>) =>
          callback(txMock),
      );

      await expect(service.cancel(1, userId)).rejects.toThrow(
        UnauthorizedReservationException,
      );
    });

    it('이미 취소된 예약이면 AlreadyCancelledException을 던진다', async () => {
      const txMock = createTxMock();
      const cancelledReservation = {
        id: 1,
        userId,
        slotId: 1,
        status: 'CANCELLED',
      };

      txMock.reservation.findUnique.mockResolvedValue(cancelledReservation);

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: typeof txMock) => Promise<unknown>) =>
          callback(txMock),
      );

      await expect(service.cancel(1, userId)).rejects.toThrow(
        AlreadyCancelledException,
      );
    });
  });

  describe('findAllByUser', () => {
    it('사용자의 모든 예약을 관계와 함께 반환한다', async () => {
      const userId = 'user-123';
      const mockReservations = [
        {
          id: 1,
          userId,
          slotId: 1,
          status: 'CONFIRMED',
          slot: {
            id: 1,
            event: { id: 1, title: 'Test Event' },
          },
        },
      ];

      prismaMock.reservation.findMany.mockResolvedValue(mockReservations);

      const result = await service.findAllByUser(userId);

      expect(result).toEqual(mockReservations);
      expect(prismaMock.reservation.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          slot: {
            include: {
              event: true,
            },
          },
        },
        orderBy: {
          reservedAt: 'desc',
        },
      });
    });
  });
});
