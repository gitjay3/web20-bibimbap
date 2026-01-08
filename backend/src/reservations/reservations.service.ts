import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApplyReservationDto } from './dto/apply-reservation.dto';
import { Reservation, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReservationStatusEvent } from './events/reservation-status.event';
type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    EventSlot: {
      include: {
        Event: true;
      };
    };
  };
}>;

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async apply(userId: string, dto: ApplyReservationDto): Promise<Reservation> {
    // 한 트랜잭션 내에서 원자적 실행 -> tx
    try {
      const reservation = await this.prisma.$transaction(async (tx) => {
        const slot = await tx.eventSlot.findUnique({
          where: { id: dto.slotId },
        });

        if (!slot) {
          throw new NotFoundException('예약을 찾을 수 없습니다');
        }

        if (slot.currentCount >= slot.maxCapacity) {
          throw new BadRequestException('정원이 마감되었습니다');
        }
        // 중복체크
        const existing = await tx.reservation.findFirst({
          where: {
            userId,
            slotId: dto.slotId,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
        });

        if (existing) {
          throw new BadRequestException('이미 예약한 일정입니다');
        }

        // 카운트 증가까지 원자적으로 실행
        const [reservation] = await Promise.all([
          tx.reservation.create({
            data: {
              userId,
              slotId: dto.slotId,
              status: 'CONFIRMED', // 즉시 확정
            },
          }),
          tx.eventSlot.update({
            where: { id: dto.slotId },
            data: { currentCount: { increment: 1 } },
          }),
        ]);

        return reservation;
      });

      this.eventEmitter.emit(
        'reservation.status',
        new ReservationStatusEvent(
          userId,
          reservation.id,
          'CONFIRMED',
          '예약이 완료되었습니다.',
        ),
      );

      return reservation;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '예약 처리 중 오류가 발생했습니다';

      this.eventEmitter.emit(
        'reservation.status',
        new ReservationStatusEvent(userId, 0, 'FAILED', errorMessage),
      );

      throw error;
    }
  }

  async findAllByUser(userId: string): Promise<ReservationWithRelations[]> {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: {
        EventSlot: {
          include: {
            Event: true,
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
        EventSlot: {
          include: {
            Event: true,
          },
        },
      },
    }) as Promise<ReservationWithRelations | null>;
  }

  async cancel(id: number, userId: string): Promise<Reservation> {
    // apply와 동일
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const reservation = await tx.reservation.findUnique({
          where: { id },
        });

        if (!reservation) {
          throw new NotFoundException('예약을 찾을 수 없습니다');
        }

        if (reservation.status === 'CANCELLED') {
          throw new BadRequestException('이미 취소된 예약입니다');
        }

        //TODO: 추후 사용자 인증 확정하고 본인 예약만 취소할 수 있게 체크 로직 구현해야 함

        const [updated] = await Promise.all([
          tx.reservation.update({
            where: { id },
            data: { status: 'CANCELLED' },
          }),
          tx.eventSlot.update({
            where: { id: reservation.slotId },
            data: { currentCount: { decrement: 1 } },
          }),
        ]);

        return { updated, userId: reservation.userId };
      });

      this.eventEmitter.emit(
        'reservation.status',
        new ReservationStatusEvent(
          updated.userId,
          id,
          'CANCELLED',
          '예약이 취소되었습니다',
        ),
      );

      return updated.updated;
    } catch (error) {
      this.eventEmitter.emit(
        'reservation.status',
        new ReservationStatusEvent(
          userId,
          id,
          'FAILED',
          error instanceof Error
            ? error.message
            : '예약 취소 중 오류가 발생했습니다',
        ),
      );
      throw error;
    }
  }
}
