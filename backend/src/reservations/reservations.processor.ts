import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  ReservationJobData,
  RESERVATION_QUEUE,
  PROCESS_RESERVATION_JOB,
} from './dto/reservation-job.dto';
import {
  SlotFullException,
  OptimisticLockException,
  SlotNotFoundException,
  DuplicateReservationException,
  TeamAlreadyReservedException,
} from '../../common/exceptions/api.exception';
import { MetricsService } from '../metrics/metrics.service';

@Processor(RESERVATION_QUEUE)
export class ReservationsProcessor extends WorkerHost {
  private readonly logger = new Logger(ReservationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly metricsService: MetricsService,
  ) {
    super();
  }

  async process(job: Job<ReservationJobData>): Promise<void> {
    if (job.name !== PROCESS_RESERVATION_JOB) {
      this.logger.warn(`확인되지 않은 job: ${job.name}`);
      return;
    }

    const {
      reservationId,
      userId,
      slotId,
      maxCapacity,
      stockDeducted,
      groupNumber,
    } = job.data;
    const startTime = Date.now();

    this.logger.log(
      `예약 처리 시작: jobId=${job.id}, userId=${userId}, slotId=${slotId}`,
    );

    try {
      await this.processReservation(reservationId, userId, slotId, groupNumber);
      this.logger.log(`예약 확정: userId=${userId}, slotId=${slotId}`);

      // 성공 메트릭
      this.metricsService.recordQueueJobComplete(
        RESERVATION_QUEUE,
        'completed',
        Date.now() - startTime,
      );
      this.metricsService.recordReservation(slotId, 'confirmed');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`예약 실패: ${message}`);

      // PENDING 레코드를 CANCELLED로 변경
      const { reservationId } = job.data;
      await this.prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'CANCELLED' },
      });

      // 실패 메트릭
      this.metricsService.recordQueueJobComplete(
        RESERVATION_QUEUE,
        'failed',
        Date.now() - startTime,
      );
      this.metricsService.recordReservation(slotId, 'failed');

      // 보상 트랜잭션: Redis 선차감된 경우에만 재고 복구
      if (stockDeducted) {
        await this.redisService.incrementStock(
          slotId,
          maxCapacity,
          'failure_recovery',
        );
        this.logger.warn(`재고 복구 완료: slotId=${slotId}`);
      }

      throw error; // BullMQ가 재시도 또는 실패 처리
    }
  }

  private async processReservation(
    reservationId: number,
    userId: string,
    slotId: number,
    groupNumber: number | null,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 슬롯(정원) 조회
      const slot = await tx.eventSlot.findUnique({
        where: { id: slotId },
      });
      if (!slot) throw new SlotNotFoundException();

      // 중복 예약 확인 (현재 처리 중인 예약은 제외)
      if (groupNumber) {
        // 팀 단위
        const existingTeam = await tx.reservation.findFirst({
          where: {
            slotId,
            groupNumber,
            status: { in: ['PENDING', 'CONFIRMED'] },
            id: { not: reservationId },
          },
          select: { id: true },
        });
        if (existingTeam) throw new TeamAlreadyReservedException();
      } else {
        // 개인 단위
        const existing = await tx.reservation.findFirst({
          where: {
            userId,
            slotId,
            status: { in: ['PENDING', 'CONFIRMED'] },
            id: { not: reservationId },
          },
          select: { id: true },
        });
        if (existing) throw new DuplicateReservationException();
      }

      // 낙관적 락으로 슬롯 업데이트
      const updated = await tx.eventSlot.updateMany({
        where: {
          id: slotId,
          version: slot.version,
          currentCount: { lt: slot.maxCapacity },
        },
        data: {
          currentCount: { increment: 1 },
          version: { increment: 1 }, // 버전 관리
        },
      });

      // 업데이트 실패 시 (version 불일치 또는 정원 초과)
      if (updated.count === 0) {
        const currentSlot = await tx.eventSlot.findUnique({
          where: { id: slotId },
        });

        if (
          currentSlot &&
          currentSlot.currentCount >= currentSlot.maxCapacity
        ) {
          throw new SlotFullException();
        }
        // 낙관적 락 충돌 메트릭
        this.metricsService.recordOptimisticLockConflict('reservation');
        throw new OptimisticLockException();
      }

      // 예약 업데이트
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'CONFIRMED' },
      });
    });
  }
}
