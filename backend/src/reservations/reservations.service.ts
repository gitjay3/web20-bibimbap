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
  TeamRequiredException,
  TeamMemberIneligibleException,
  TeamAlreadyReservedException,
} from '../../common/exceptions/api.exception';
import { MetricsService } from '../metrics/metrics.service';
import { isUserEligibleForTrack } from '../../common/utils/track.util';

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    slot: {
      include: {
        event: true;
      };
    };
  };
}>;

type ReservationWithTeamInfo = ReservationWithRelations & {
  isTeamReservation: boolean;
};

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
    const eligibility = await this.validateEligibilityOrThrow(userId, slot);

    // 중복 예약 검증
    if (slot.event.applicationUnit === 'TEAM' && eligibility.groupNumber) {
      // 팀 단위
      const existingTeam = await this.prisma.reservation.findFirst({
        where: {
          slotId: dto.slotId,
          groupNumber: eligibility.groupNumber,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: { id: true },
      });
      if (existingTeam) throw new TeamAlreadyReservedException();
    } else {
      // 개인단위
      const existing = await this.prisma.reservation.findFirst({
        where: {
          userId,
          slotId: dto.slotId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: { id: true },
      });
      if (existing) throw new DuplicateReservationException();
    }

    // Redis에서 재고 차감 시도
    const success = await this.redisService.decrementStock(dto.slotId);

    if (!success) {
      this.metricsService.recordReservation(dto.slotId, 'slot_full');
      throw new SlotFullException();
    }

    // Redis 차감 이후 실패 시 재고를 복구하기 위한 보상 트랜잭션
    try {
      const reservation = await this.prisma.reservation.create({
        data: {
          userId,
          slotId: dto.slotId,
          status: 'PENDING',
          groupNumber:
            slot.event.applicationUnit === 'TEAM'
              ? eligibility.groupNumber
              : null,
        },
      });

      await this.reservationQueue.add(PROCESS_RESERVATION_JOB, {
        reservationId: reservation.id,
        userId,
        slotId: dto.slotId,
        eventId: slot.event.id,
        maxCapacity: slot.maxCapacity,
        stockDeducted: true,
        groupNumber:
          slot.event.applicationUnit === 'TEAM'
            ? eligibility.groupNumber
            : null,
      });
    } catch (error) {
      await this.redisService.incrementStock(
        dto.slotId,
        slot.maxCapacity,
        'failure_recovery',
      );
      throw error;
    }

    // 메트릭 기록
    this.metricsService.recordReservation(dto.slotId, 'pending');

    this.metricsService.reservationLatency.observe(
      { operation: 'apply' },
      (Date.now() - startTime) / 1000,
    );

    // 예약 성공 시 대기열 토큰 무효화 (토큰 재사용 방지)
    await this.queueService.invalidateToken(slot.event.id, userId);

    return {
      status: 'PENDING',
      message: '예약이 접수되었습니다. 잠시 후 확정됩니다.',
    };
  }

  private async validateEligibilityOrThrow(
    userId: string,
    slot: Prisma.EventSlotGetPayload<{ include: { event: true } }>,
  ): Promise<{ groupNumber: number | null }> {
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
      select: { id: true, groupNumber: true },
    });

    if (!membership) {
      throw new ForbiddenOrganizationException();
    }

    // 트랙 검증
    const eligible = await isUserEligibleForTrack(
      this.prisma,
      userId,
      event.track,
      event.organizationId,
    );
    if (!eligible) {
      throw new ForbiddenTrackException();
    }

    //applicationUnit(INDIVIDUAL/TEAM) 관련 검증
    if (event.applicationUnit === 'TEAM') {
      if (!membership.groupNumber) {
        throw new TeamRequiredException();
      }

      const teamMembers = await this.prisma.camperOrganization.findMany({
        where: {
          organizationId: event.organizationId,
          groupNumber: membership.groupNumber,
        },
        select: { userId: true },
      });

      // 팀원 전원의 트랙 검증 (COMMON이 아닌 경우)
      if (event.track !== 'COMMON') {
        const teamPreRegs = await this.prisma.camperPreRegistration.findMany({
          where: {
            claimedUserId: { in: teamMembers.map((m) => m.userId) },
            organizationId: event.organizationId,
          },
          select: { claimedUserId: true, track: true },
        });

        const invalidMembers = teamMembers.filter((m) => {
          const preReg = teamPreRegs.find((p) => p.claimedUserId === m.userId);
          return !preReg || preReg.track !== event.track;
        });

        if (invalidMembers.length > 0) {
          throw new TeamMemberIneligibleException();
        }
      }
    }
    return { groupNumber: membership.groupNumber };
  }

  async findAllByUser(userId: string): Promise<ReservationWithTeamInfo[]> {
    //사용자의 그룹 번호 조회
    const memberships = await this.prisma.camperOrganization.findMany({
      where: { userId },
      select: { organizationId: true, groupNumber: true },
    });

    // 개인 예약 조회
    const personalReservations = await this.prisma.reservation.findMany({
      where: { userId, status: 'CONFIRMED' },
      include: {
        slot: { include: { event: true } },
      },
    });

    // 팀 예약 조회 (내가 대표자가 아닌 경우)
    const teamReservations = await this.prisma.reservation.findMany({
      where: {
        userId: { not: userId }, // 내가 대표자가 아닌 예약
        status: 'CONFIRMED',
        groupNumber: {
          in: memberships
            .map((m) => m.groupNumber)
            .filter((g): g is number => g !== null),
        },
        slot: {
          event: {
            organizationId: { in: memberships.map((m) => m.organizationId) },
            applicationUnit: 'TEAM',
          },
        },
      },
      include: {
        slot: { include: { event: true } },
      },
    });

    return [
      ...personalReservations.map((r) => ({ ...r, isTeamReservation: false })),
      ...teamReservations.map((r) => ({ ...r, isTeamReservation: true })),
    ];
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

  async findByUserAndEvent(userId: string, eventId: number) {
    //  이벤트 정보 조회
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { applicationUnit: true, organizationId: true },
    });

    if (!event) return null;

    //  개인 예약 확인
    const personalReservation = await this.prisma.reservation.findFirst({
      where: {
        userId,
        slot: { eventId },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { slot: { include: { event: true } } },
    });

    if (personalReservation) return personalReservation;

    // 팀 이벤트인 경우, 팀원의 예약도 확인
    if (event.applicationUnit === 'TEAM') {
      const membership = await this.prisma.camperOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: event.organizationId,
          },
        },
        select: { groupNumber: true },
      });

      if (membership?.groupNumber) {
        const teamReservation = await this.prisma.reservation.findFirst({
          where: {
            groupNumber: membership.groupNumber,
            slot: { eventId },
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          include: { slot: { include: { event: true } } },
        });

        if (teamReservation) return teamReservation;
      }
    }

    return null;
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
          eventId: reservation.slot.eventId,
          maxCapacity: reservation.slot.maxCapacity,
        };
      });

      // Redis 재고 복구 (트랜잭션 성공 후)
      await this.redisService.incrementStock(
        result.slotId,
        result.maxCapacity,
        'cancellation',
      );

      // 예약자 명단 캐시 무효화
      await this.redisService.invalidateReserversCache(result.eventId);

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
