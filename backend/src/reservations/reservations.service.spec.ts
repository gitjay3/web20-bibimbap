import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, createTxMock } from '../test/mocks/prisma.mock';
import type { ApplyReservationDto } from './dto/apply-reservation.dto';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: prismaMock },
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

    it('예약을 성공적으로 생성한다', async () => {
      const txMock = createTxMock();
      const mockSlot = {
        id: 1,
        currentCount: 5,
        maxCapacity: 10,
      };
      const mockReservation = {
        id: 1,
        userId,
        slotId: dto.slotId,
        status: 'CONFIRMED',
        reservedAt: new Date(),
      };

      txMock.eventSlot.findUnique.mockResolvedValue(mockSlot);
      txMock.reservation.findFirst.mockResolvedValue(null);
      txMock.reservation.create.mockResolvedValue(mockReservation);
      txMock.eventSlot.update.mockResolvedValue({
        ...mockSlot,
        currentCount: 6,
      });

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(txMock),
      );

      const result = await service.apply(userId, dto);

      expect(result).toEqual(mockReservation);
      expect(txMock.eventSlot.findUnique).toHaveBeenCalledWith({
        where: { id: dto.slotId },
      });
      expect(txMock.reservation.create).toHaveBeenCalled();
    });

    it('슬롯이 존재하지 않으면 NotFoundException을 던진다', async () => {
      const txMock = createTxMock();
      txMock.eventSlot.findUnique.mockResolvedValue(null);

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(txMock),
      );

      await expect(service.apply(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.apply(userId, dto)).rejects.toThrow(
        '예약을 찾을 수 없습니다',
      );
    });

    it('정원이 마감되면 BadRequestException을 던진다', async () => {
      const txMock = createTxMock();
      const fullSlot = {
        id: 1,
        currentCount: 10,
        maxCapacity: 10,
      };

      txMock.eventSlot.findUnique.mockResolvedValue(fullSlot);

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(txMock),
      );

      await expect(service.apply(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.apply(userId, dto)).rejects.toThrow(
        '정원이 마감되었습니다',
      );
    });

    it('이미 예약이 있으면 BadRequestException을 던진다', async () => {
      const txMock = createTxMock();
      const mockSlot = {
        id: 1,
        currentCount: 5,
        maxCapacity: 10,
      };
      const existingReservation = {
        id: 99,
        userId,
        slotId: dto.slotId,
        status: 'CONFIRMED',
      };

      txMock.eventSlot.findUnique.mockResolvedValue(mockSlot);
      txMock.reservation.findFirst.mockResolvedValue(existingReservation);

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(txMock),
      );

      await expect(service.apply(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.apply(userId, dto)).rejects.toThrow(
        '이미 예약한 일정입니다',
      );
    });

    it('PENDING과 CONFIRMED 상태의 기존 예약을 확인한다', async () => {
      const txMock = createTxMock();
      const mockSlot = {
        id: 1,
        currentCount: 5,
        maxCapacity: 10,
      };

      txMock.eventSlot.findUnique.mockResolvedValue(mockSlot);
      txMock.reservation.findFirst.mockResolvedValue(null);
      txMock.reservation.create.mockResolvedValue({});
      txMock.eventSlot.update.mockResolvedValue({});

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(txMock),
      );

      await service.apply(userId, dto);

      expect(txMock.reservation.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          slotId: dto.slotId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });
    });
  });

  describe('cancel', () => {
    it('예약을 성공적으로 취소한다', async () => {
      const txMock = createTxMock();
      const reservationId = 1;
      const mockReservation = {
        id: reservationId,
        userId: 'user-123',
        slotId: 1,
        status: 'CONFIRMED',
      };
      const updatedReservation = {
        ...mockReservation,
        status: 'CANCELLED',
      };

      txMock.reservation.findUnique.mockResolvedValue(mockReservation);
      txMock.reservation.update.mockResolvedValue(updatedReservation);
      txMock.eventSlot.update.mockResolvedValue({});

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(txMock),
      );

      const result = await service.cancel(reservationId);

      expect(result).toEqual(updatedReservation);
      expect(txMock.eventSlot.update).toHaveBeenCalledWith({
        where: { id: mockReservation.slotId },
        data: { currentCount: { decrement: 1 } },
      });
    });

    it('예약이 존재하지 않으면 NotFoundException을 던진다', async () => {
      const txMock = createTxMock();
      txMock.reservation.findUnique.mockResolvedValue(null);

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(txMock),
      );

      await expect(service.cancel(999)).rejects.toThrow(NotFoundException);
    });

    it('이미 취소된 예약이면 BadRequestException을 던진다', async () => {
      const txMock = createTxMock();
      const cancelledReservation = {
        id: 1,
        status: 'CANCELLED',
      };

      txMock.reservation.findUnique.mockResolvedValue(cancelledReservation);

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(txMock),
      );

      await expect(service.cancel(1)).rejects.toThrow(BadRequestException);
      await expect(service.cancel(1)).rejects.toThrow('이미 취소된 예약입니다');
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
            Event: { id: 1, title: 'Test Event' },
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
