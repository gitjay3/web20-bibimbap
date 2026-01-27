import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { ReservationsProcessor } from './reservations.processor';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MetricsService } from '../metrics/metrics.service';
import { createPrismaMock, createTxMock } from '../test/mocks/prisma.mock';
import {
  PROCESS_RESERVATION_JOB,
  ReservationJobData,
} from './dto/reservation-job.dto';
import {
  SlotFullException,
  OptimisticLockException,
  SlotNotFoundException,
  DuplicateReservationException,
} from '../../common/exceptions/api.exception';
import { createMockEventSlot } from '../test/mocks/mock-factory';

const createRedisMock = () => ({
  incrementStock: jest.fn().mockResolvedValue(1),
  decrementStock: jest.fn().mockResolvedValue(true),
  initStock: jest.fn().mockResolvedValue(undefined),
  getStock: jest.fn().mockResolvedValue(10),
});

const createMetricsMock = () => ({
  recordQueueJobComplete: jest.fn(),
  recordReservation: jest.fn(),
  recordOptimisticLockConflict: jest.fn(),
});

const createMockJob = (
  data: ReservationJobData,
  name = PROCESS_RESERVATION_JOB,
): Job<ReservationJobData> =>
  ({
    id: 'job-123',
    name,
    data,
  }) as Job<ReservationJobData>;

describe('ReservationsProcessor', () => {
  let processor: ReservationsProcessor;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let redisMock: ReturnType<typeof createRedisMock>;
  let metricsMock: ReturnType<typeof createMetricsMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    redisMock = createRedisMock();
    metricsMock = createMetricsMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsProcessor,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
        { provide: MetricsService, useValue: metricsMock },
      ],
    }).compile();

    processor = module.get<ReservationsProcessor>(ReservationsProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    const userId = 'user-123';
    const slotId = 1;
    const maxCapacity = 10;
    const baseJobData: ReservationJobData = {
      userId,
      slotId,
      maxCapacity,
      stockDeducted: true,
      groupNumber: null,
    };

    it('알 수 없는 job 이름이면 처리하지 않고 반환한다', async () => {
      // Arrange
      const job = createMockJob(baseJobData, 'unknown-job');

      // Act
      await processor.process(job);

      // Assert
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('예약을 성공적으로 처리한다', async () => {
      // Arrange
      const job = createMockJob(baseJobData);
      const mockSlot = createMockEventSlot({
        id: slotId,
        maxCapacity,
        currentCount: 5,
        version: 1,
      });
      const txMock = createTxMock();

      txMock.eventSlot.findUnique.mockResolvedValue(mockSlot);
      txMock.reservation.findFirst.mockResolvedValue(null); // 중복 예약 없음
      txMock.eventSlot.updateMany.mockResolvedValue({ count: 1 }); // 업데이트 성공
      txMock.reservation.create.mockResolvedValue({
        id: 1,
        userId,
        slotId,
        status: 'CONFIRMED',
      });

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: typeof txMock) => Promise<unknown>) =>
          callback(txMock),
      );

      // Act
      await processor.process(job);

      // Assert
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(txMock.reservation.create).toHaveBeenCalledWith({
        data: {
          userId,
          slotId,
          status: 'CONFIRMED',
          groupNumber: null,
        },
      });
      expect(metricsMock.recordQueueJobComplete).toHaveBeenCalledWith(
        'reservation-queue',
        'completed',
        expect.any(Number),
      );
      expect(metricsMock.recordReservation).toHaveBeenCalledWith(
        slotId,
        'confirmed',
      );
    });

    it('슬롯이 없으면 SlotNotFoundException을 던지고 재고를 복구한다', async () => {
      // Arrange
      const job = createMockJob(baseJobData);
      const txMock = createTxMock();

      txMock.eventSlot.findUnique.mockResolvedValue(null);

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: typeof txMock) => Promise<unknown>) =>
          callback(txMock),
      );

      // Act & Assert
      await expect(processor.process(job)).rejects.toThrow(
        SlotNotFoundException,
      );
      expect(redisMock.incrementStock).toHaveBeenCalledWith(
        slotId,
        maxCapacity,
        'failure_recovery',
      );
      expect(metricsMock.recordQueueJobComplete).toHaveBeenCalledWith(
        'reservation-queue',
        'failed',
        expect.any(Number),
      );
      expect(metricsMock.recordReservation).toHaveBeenCalledWith(
        slotId,
        'failed',
      );
    });

    it('중복 예약이면 DuplicateReservationException을 던지고 재고를 복구한다', async () => {
      // Arrange
      const job = createMockJob(baseJobData);
      const mockSlot = createMockEventSlot({ id: slotId });
      const mockExistingReservation = { id: 99, status: 'CONFIRMED' };
      const txMock = createTxMock();

      txMock.eventSlot.findUnique.mockResolvedValue(mockSlot);
      txMock.reservation.findFirst.mockResolvedValue(mockExistingReservation);

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: typeof txMock) => Promise<unknown>) =>
          callback(txMock),
      );

      // Act & Assert
      await expect(processor.process(job)).rejects.toThrow(
        DuplicateReservationException,
      );
      expect(redisMock.incrementStock).toHaveBeenCalledWith(
        slotId,
        maxCapacity,
        'failure_recovery',
      );
    });

    it('정원이 초과되면 SlotFullException을 던지고 재고를 복구한다', async () => {
      // Arrange
      const job = createMockJob(baseJobData);
      const mockSlot = createMockEventSlot({
        id: slotId,
        maxCapacity,
        currentCount: 9,
        version: 1,
      });
      const txMock = createTxMock();

      txMock.eventSlot.findUnique
        .mockResolvedValueOnce(mockSlot) // 첫 번째 조회
        .mockResolvedValueOnce({ ...mockSlot, currentCount: maxCapacity }); // 재조회 시 정원 초과
      txMock.reservation.findFirst.mockResolvedValue(null);
      txMock.eventSlot.updateMany.mockResolvedValue({ count: 0 }); // 업데이트 실패

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: typeof txMock) => Promise<unknown>) =>
          callback(txMock),
      );

      // Act & Assert
      await expect(processor.process(job)).rejects.toThrow(SlotFullException);
      expect(redisMock.incrementStock).toHaveBeenCalledWith(
        slotId,
        maxCapacity,
        'failure_recovery',
      );
    });

    it('낙관적 락 충돌이면 OptimisticLockException을 던지고 재고를 복구한다', async () => {
      // Arrange
      const job = createMockJob(baseJobData);
      const mockSlot = createMockEventSlot({
        id: slotId,
        maxCapacity,
        currentCount: 5,
        version: 1,
      });
      const txMock = createTxMock();

      txMock.eventSlot.findUnique
        .mockResolvedValueOnce(mockSlot)
        .mockResolvedValueOnce({ ...mockSlot, currentCount: 6 }); // 정원 초과 아님 -> 낙관적 락 충돌
      txMock.reservation.findFirst.mockResolvedValue(null);
      txMock.eventSlot.updateMany.mockResolvedValue({ count: 0 }); // 업데이트 실패

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: typeof txMock) => Promise<unknown>) =>
          callback(txMock),
      );

      // Act & Assert
      await expect(processor.process(job)).rejects.toThrow(
        OptimisticLockException,
      );
      expect(metricsMock.recordOptimisticLockConflict).toHaveBeenCalledWith(
        'reservation',
      );
      expect(redisMock.incrementStock).toHaveBeenCalledWith(
        slotId,
        maxCapacity,
        'failure_recovery',
      );
    });

    it('stockDeducted가 false이면 실패 시 재고를 복구하지 않는다', async () => {
      // Arrange
      const jobData: ReservationJobData = {
        ...baseJobData,
        stockDeducted: false,
      };
      const job = createMockJob(jobData);
      const txMock = createTxMock();

      txMock.eventSlot.findUnique.mockResolvedValue(null);

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: typeof txMock) => Promise<unknown>) =>
          callback(txMock),
      );

      // Act & Assert
      await expect(processor.process(job)).rejects.toThrow(
        SlotNotFoundException,
      );
      expect(redisMock.incrementStock).not.toHaveBeenCalled();
    });
  });
});
