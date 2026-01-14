import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyReservationDto } from './dto/apply-reservation.dto';
import { Reservation, Prisma } from '@prisma/client';

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
  constructor(private prisma: PrismaService) {}

  async apply(userId: string, dto: ApplyReservationDto): Promise<Reservation> {
    // 한 트랜잭션 내에서 원자적 실행 -> tx
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

    return reservation;
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

  async cancel(id: number): Promise<Reservation> {
    // apply와 동일
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

    return updated.updated;
  }
}
