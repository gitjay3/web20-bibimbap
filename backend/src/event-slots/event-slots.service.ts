import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UpdateEventSlotDto } from './dto/update-event-slot.dto';
import { CreateEventSlotDto } from './dto/create-event-slot.dto';
import { ReservationUser } from '../common/types/reservation.types';

@Injectable()
export class EventSlotsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findByEventWithAvailability(eventId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        slots: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('일정을 찾을 수 없습니다');
    }

    const slots = event.slots.map((slot) => ({
      id: slot.id,
      maxCapacity: slot.maxCapacity,
      currentCount: slot.currentCount,
      remainingSeats: Math.max(0, slot.maxCapacity - slot.currentCount),
      isAvailable: slot.currentCount < slot.maxCapacity,
      extraInfo: slot.extraInfo,
    }));

    return {
      eventId: event.id,
      eventTitle: event.title,
      slots,
    };
  }

  async getAvailabilityByEvent(eventId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        applicationUnit: true,
        organizationId: true,
        slots: {
          // ← 추가
          orderBy: { id: 'asc' },
          include: {
            reservations: {
              where: { status: 'CONFIRMED' },
              select: {
                groupNumber: true,
                user: {
                  select: { name: true, username: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다');
    }

    const slots = event.slots;

    if (slots.length === 0) {
      throw new NotFoundException('해당 이벤트의 슬롯을 찾을 수 없습니다');
    }

    // 팀 단위 이벤트인 경우 팀원 정보 조회
    let teamMembersMap: Map<
      number,
      Array<{ name: string; username: string; avatarUrl: string | null }>
    > | null = null;

    if (event.applicationUnit === 'TEAM') {
      const groupNumbers = [
        ...new Set(
          slots.flatMap((s) =>
            s.reservations
              .map((r) => r.groupNumber)
              .filter((g): g is number => g !== null),
          ),
        ),
      ];

      if (groupNumbers.length > 0) {
        const members = await this.prisma.camperOrganization.findMany({
          where: {
            organizationId: event.organizationId,
            groupNumber: { in: groupNumbers },
          },
          include: {
            user: {
              select: { name: true, username: true, avatarUrl: true },
            },
          },
        });

        teamMembersMap = new Map();
        for (const m of members) {
          if (!m.groupNumber) continue;
          if (!teamMembersMap.has(m.groupNumber)) {
            teamMembersMap.set(m.groupNumber, []);
          }
          teamMembersMap.get(m.groupNumber)!.push({
            name: m.user.name ?? m.user.username ?? '',
            username: m.user.username,
            avatarUrl: m.user.avatarUrl,
          });
        }
      }
    }

    return {
      applicationUnit: event.applicationUnit,
      slots: slots.map((slot) => ({
        slotId: slot.id,
        currentCount: slot.currentCount,
        remainingSeats: Math.max(0, slot.maxCapacity - slot.currentCount),
        isAvailable: slot.currentCount < slot.maxCapacity,
        reservations: slot.reservations.map((r) => ({
          name: r.user.name || r.user.username,
          username: r.user.username,
          avatarUrl: r.user.avatarUrl,
          groupNumber: r.groupNumber,
          teamMembers:
            r.groupNumber && teamMembersMap
              ? (teamMembersMap.get(r.groupNumber) ?? [])
              : undefined,
        })),
      })),
      timestamp: new Date().toISOString(),
    };
  }

  async getAvailability(slotIds: number[]) {
    const slots = await this.prisma.eventSlot.findMany({
      where: {
        id: { in: slotIds },
      },
      include: {
        reservations: {
          where: { status: 'CONFIRMED' },
          select: {
            user: {
              select: {
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const transformedSlots = slots.map((slot) => ({
      slotId: slot.id,
      currentCount: slot.currentCount,
      remainingSeats: Math.max(0, slot.maxCapacity - slot.currentCount),
      isAvailable: slot.currentCount < slot.maxCapacity,
      reservations: (slot.reservations as unknown as ReservationUser[]).map(
        (r: ReservationUser) => ({
          name: r.user.name || r.user.username,
          username: r.user.username,
          avatarUrl: r.user.avatarUrl,
        }),
      ),
    }));

    return {
      slots: transformedSlots,
      timestamp: new Date().toISOString(),
    };
  }

  async update(id: number, dto: UpdateEventSlotDto) {
    const slot = await this.prisma.eventSlot.findUnique({ where: { id } });

    if (!slot) {
      throw new NotFoundException('슬롯을 찾을 수 없습니다.');
    }

    if (dto.maxCapacity !== undefined && dto.maxCapacity < slot.currentCount) {
      throw new BadRequestException(
        '정원은 현재 예약 수보다 작을 수 없습니다.',
      );
    }

    const updatedSlot = await this.prisma.eventSlot.update({
      where: { id },
      data: {
        ...(dto.maxCapacity !== undefined && { maxCapacity: dto.maxCapacity }),
        ...(dto.extraInfo !== undefined && {
          extraInfo: dto.extraInfo as Prisma.InputJsonValue,
        }),
      },
    });

    // maxCapacity 변경 시 Redis 재고 동기화
    if (dto.maxCapacity !== undefined) {
      await this.redisService.initStock(
        id,
        updatedSlot.maxCapacity,
        updatedSlot.currentCount,
      );
    }

    return updatedSlot;
  }

  async delete(id: number) {
    const slot = await this.prisma.eventSlot.findUnique({
      where: { id },
      include: { reservations: { where: { status: 'CONFIRMED' } } },
    });

    if (!slot) {
      throw new NotFoundException('슬롯을 찾을 수 없습니다.');
    }

    if (slot.reservations.length > 0) {
      throw new BadRequestException('예약이 있는 슬롯은 삭제할 수 없습니다.');
    }

    return this.prisma.eventSlot.delete({ where: { id } });
  }

  async create(dto: CreateEventSlotDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    const slot = await this.prisma.eventSlot.create({
      data: {
        eventId: dto.eventId,
        maxCapacity: dto.maxCapacity,
        currentCount: 0,
        extraInfo: dto.extraInfo as Prisma.InputJsonValue,
      },
    });

    // Redis 재고 초기화
    await this.redisService.initStock(slot.id, slot.maxCapacity, 0);

    return slot;
  }
}
