import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Track, Event, EventSlot } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { toPrismaJson } from 'src/common/utils/to-json';
import { UpdateEventDto } from './dto/update-event.dto';

type EventWithSlots = Event & { slots: EventSlot[] };

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(dto: CreateEventDto, creatorId: string) {
    const {
      title,
      description,
      track,
      applicationUnit,
      startTime,
      endTime,
      slotSchema,
      organizationId,
      slots,
    } = dto;

    const slotSchemaJson = toPrismaJson(slotSchema);

    const event = (await this.prisma.event.create({
      data: {
        title,
        description,
        track,
        applicationUnit,
        startTime,
        endTime,
        slotSchema: slotSchemaJson,
        creatorId,
        organizationId,

        slots: {
          create: slots.map((slot) => ({
            maxCapacity: slot.maxCapacity,
            extraInfo: slot.extraInfo,
          })),
        },
      },
      include: {
        slots: true,
      },
    })) as EventWithSlots;

    await Promise.all(
      event.slots.map((slot) =>
        this.redisService.initStock(slot.id, slot.maxCapacity, 0),
      ),
    );

    return event;
  }

  async update(id: number, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.track !== undefined && { track: dto.track }),
        ...(dto.applicationUnit !== undefined && {
          applicationUnit: dto.applicationUnit,
        }),
        ...(dto.startTime !== undefined && {
          startTime: new Date(dto.startTime),
        }),
        ...(dto.endTime !== undefined && { endTime: new Date(dto.endTime) }),
        ...(dto.slotSchema !== undefined && {
          slotSchema: dto.slotSchema as Prisma.InputJsonValue,
        }),
      },
    });
  }

  async delete(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        slots: {
          include: {
            reservations: { where: { status: 'CONFIRMED' } },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    // 확정된 예약이 있는 슬롯이 있으면 삭제 불가
    const hasConfirmedReservations = event.slots.some(
      (slot) => slot.reservations.length > 0,
    );

    if (hasConfirmedReservations) {
      throw new BadRequestException(
        '확정된 예약이 있는 이벤트는 삭제할 수 없습니다.',
      );
    }

    await this.prisma.eventSlot.deleteMany({ where: { eventId: id } });
    return this.prisma.event.delete({ where: { id } });
  }

  async findAll(track?: string, organizationId?: string) {
    const parsedTrack = this.parseTrack(track);

    return this.prisma.event.findMany({
      where: {
        AND: [
          parsedTrack && parsedTrack !== Track.COMMON
            ? { track: parsedTrack }
            : {},
          organizationId ? { organizationId } : {},
        ],
      },
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        track: true,
        applicationUnit: true,
        startTime: true,
        endTime: true,
      },
    });
  }

  async findOne(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        slots: true,
      },
    });

    if (!event) throw new NotFoundException('존재하지 않는 이벤트입니다.');

    return event;
  }

  private parseTrack(track?: string): Track | undefined {
    if (!track) return undefined;

    const normalized = track.trim().toUpperCase();

    if (!(normalized in Track)) {
      throw new BadRequestException('유효하지 않은 track 값입니다.');
    }

    return Track[normalized as keyof typeof Track];
  }
}
