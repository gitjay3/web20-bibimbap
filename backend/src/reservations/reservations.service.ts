import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ApplyReservationDto } from './dto/apply-reservation.dto';
import { Reservation, Prisma } from '@prisma/client';
import {
  ReservationJobData,
  RESERVATION_QUEUE,
  PROCESS_RESERVATION_JOB,
} from './dto/reservation-job.dto';
import {
  SlotFullException,
  SlotNotFoundException,
  ReservationNotFoundException,
  UnauthorizedReservationException,
  AlreadyCancelledException,
  OptimisticLockException,
} from '../../common/exceptions/api.exception';

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
    private prisma: PrismaService,
    private redisService: RedisService,
    @InjectQueue(RESERVATION_QUEUE)
    private reservationQueue: Queue<ReservationJobData>,
  ) {}

  async apply(
    userId: string,
    dto: ApplyReservationDto,
  ): Promise<{ status: string; message: string }> {
    // 슬롯 정보 조회
    const slot = await this.prisma.eventSlot.findUnique({
      where: { id: dto.slotId },
    });

    if (!slot) {
      throw new SlotNotFoundException();
    }

    // Redis에서 재고 차감 시도
    const success = await this.redisService.decrementStock(dto.slotId);

    if (!success) {
      throw new SlotFullException();
    }

    // Queue에 Job 추가
    await this.reservationQueue.add(PROCESS_RESERVATION_JOB, {
      userId,
      slotId: dto.slotId,
      maxCapacity: slot.maxCapacity,
    });

    // 즉시 응답 (비동기 처리)
    return {
      status: 'PENDING',
      message: '예약이 접수되었습니다. 잠시 후 확정됩니다.', // 예약 대기 시간 확인하고 이 메세지 수정 혹은 생략 가능
    };
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
    const result = await this.prisma.$transaction(async (tx) => {
      // 예약 조회 (슬롯 정보 포함) -> 트랜잭션을 위한 version과 maxCapacity 받아와야 함
      const reservation = await tx.reservation.findUnique({
        where: { id },
        include: { slot: true },
      });

      if (!reservation) {
        throw new ReservationNotFoundException();
      }

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
    await this.redisService.incrementStock(result.slotId, result.maxCapacity);

    return result.reservation;
  }
}
