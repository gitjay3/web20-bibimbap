import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Track, Event, EventSlot } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { toPrismaJson } from 'src/common/utils/to-json';

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
        slots: {
          orderBy: {
            id: 'asc',
          },
        },
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
