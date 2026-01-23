import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ApplyReservationDto } from './dto/apply-reservation.dto';
import { Reservation, Prisma } from '@prisma/client';
import { QueueService } from 'src/queue/queue.service';
import {
  ReservationJobData,
  RESERVATION_QUEUE,
  PROCESS_RESERVATION_JOB,
} from './dto/reservation-job.dto';
import {
  SlotFullException,
  SlotNotFoundException,
  DuplicateReservationException,
  ReservationNotFoundException,
  UnauthorizedReservationException,
  AlreadyCancelledException,
  OptimisticLockException,
  ReservationPeriodException,
  ForbiddenOrganizationException,
  ForbiddenTrackException,
} from '../../common/exceptions/api.exception';
import { MetricsService } from '../metrics/metrics.service';

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    slot: {
      include: {
        event: true;
      };
    };
  };
}>;

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private queueService: QueueService,
    private metricsService: MetricsService,
    @InjectQueue(RESERVATION_QUEUE)
    private readonly reservationQueue: Queue<ReservationJobData>,
  ) {}

  async apply(
    userId: string,
    dto: ApplyReservationDto,
  ): Promise<{ status: 'PENDING'; message: string }> {
    const startTime = Date.now();

    // 슬롯 + 이벤트 조회
    const slot = await this.prisma.eventSlot.findUnique({
      where: { id: dto.slotId },
      include: { event: true },
    });

    if (!slot) throw new SlotNotFoundException();

    // 자격 검증
    await this.validateEligibilityOrThrow(userId, slot);

    // 중복 예약 검증
    const existing = await this.prisma.reservation.findFirst({
      where: {
        userId,
        slotId: dto.slotId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { id: true },
    });
    if (existing) throw new DuplicateReservationException();

    // Redis에서 재고 차감 시도
    const success = await this.redisService.decrementStock(dto.slotId);

    if (!success) {
      this.metricsService.recordReservation(dto.slotId, 'slot_full');
      throw new SlotFullException();
    }

    // Queue에 Job 추가
    await this.reservationQueue.add(PROCESS_RESERVATION_JOB, {
      userId,
      slotId: dto.slotId,
      maxCapacity: slot.maxCapacity,
      stockDeducted: true,
    });

    // 메트릭 기록
    this.metricsService.recordReservation(dto.slotId, 'pending');
    this.metricsService.reservationLatency.observe(
      { operation: 'apply' },
      (Date.now() - startTime) / 1000,
    );

    // TODO: await this.queueService.invalidateToken(dto.eventId, userId); 지금은 수강신청같은 방식. 1인 1예약이라면 토큰 무효화

    return {
      status: 'PENDING',
      message: '예약이 접수되었습니다. 잠시 후 확정됩니다.', // 예약 대기 시간 확인하고 이 메세지 수정 혹은 생략 가능
    };
  }

  private async validateEligibilityOrThrow(
    userId: string,
    slot: Prisma.EventSlotGetPayload<{ include: { event: true } }>,
  ): Promise<void> {
    const now = new Date();
    const event = slot.event;

    // 예약 기간 검증
    if (now < event.startTime || now > event.endTime) {
      throw new ReservationPeriodException();
    }

    // 조직 소속 검증
    const membership = await this.prisma.camperOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: event.organizationId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenOrganizationException();
    }

    // 트랙 검증
    if (event.track !== 'COMMON') {
      const preReg = await this.prisma.camperPreRegistration.findFirst({
        where: {
          claimedUserId: userId,
          organizationId: event.organizationId,
        },
        select: { track: true, status: true },
      });

      if (!preReg) {
        throw new ForbiddenTrackException();
      }

      if (preReg.track !== event.track) {
        throw new ForbiddenTrackException();
      }
    }

    // TODO: applicationUnit(INDIVIDUAL/TEAM) 관련 검증
  }

  async findAllByUser(userId: string): Promise<ReservationWithRelations[]> {
    return this.prisma.reservation.findMany({
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
    }) as Promise<ReservationWithRelations[]>;
  }

  async findOne(id: number): Promise<ReservationWithRelations | null> {
    return this.prisma.reservation.findUnique({
      where: { id },
      include: {
        slot: {
          include: {
            event: true,
          },
        },
      },
    }) as Promise<ReservationWithRelations | null>;
  }

  async findByUserAndEvent(
    userId: string,
    eventId: number,
  ): Promise<ReservationWithRelations | null> {
    return this.prisma.reservation.findFirst({
      where: {
        userId,
        slot: { eventId },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { slot: { include: { event: true } } },
    }) as Promise<ReservationWithRelations | null>;
  }

  async cancel(id: number, userId: string): Promise<Reservation> {
    const startTime = Date.now();
    let slotId: number | undefined;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 예약 조회 (슬롯 정보 포함) -> 트랜잭션을 위한 version과 maxCapacity 받아와야 함
        const reservation = await tx.reservation.findUnique({
          where: { id },
          include: { slot: true },
        });

        if (!reservation) {
          throw new ReservationNotFoundException();
        }

        slotId = reservation.slotId;

        if (reservation.userId !== userId) {
          throw new UnauthorizedReservationException();
        }

        if (reservation.status === 'CANCELLED') {
          throw new AlreadyCancelledException();
        }

        // 낙관적 락을 통한 슬롯 업데이트
        const updatedSlot = await tx.eventSlot.updateMany({
          where: {
            id: reservation.slotId,
            version: reservation.slot.version, // Read version
          },
          data: {
            currentCount: { decrement: 1 },
            version: { increment: 1 },
          },
        });

        if (updatedSlot.count === 0) {
          this.metricsService.recordOptimisticLockConflict('cancellation');
          throw new OptimisticLockException();
        }

        // 예약 상태 변경
        const updatedReservation = await tx.reservation.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });

        return {
          reservation: updatedReservation,
          slotId: reservation.slotId,
          maxCapacity: reservation.slot.maxCapacity,
        };
      });

      // Redis 재고 복구 (트랜잭션 성공 후)
      await this.redisService.incrementStock(
        result.slotId,
        result.maxCapacity,
        'cancellation',
      );

      // 메트릭 기록
      this.metricsService.recordReservation(result.slotId, 'cancelled');
      this.metricsService.reservationLatency.observe(
        { operation: 'cancel' },
        (Date.now() - startTime) / 1000,
      );

      return result.reservation;
    } catch (error) {
      if (slotId) {
        this.metricsService.recordReservation(slotId, 'failed');
      }
      throw error;
    }
  }
}
