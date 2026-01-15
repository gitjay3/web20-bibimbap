import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Track } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto, creatorId: string) {
    const {
      title,
      description,
      track,
      applicationUnit,
      startTime,
      endTime,
      slotSchema,
      slots,
    } = dto;

    return await this.prisma.event.create({
      data: {
        title,
        description,
        track,
        applicationUnit,
        startTime,
        endTime,
        slotSchema,
        creatorId,

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
    });
  }

  async findAll(track?: string) {
    const parsedTrack = this.parseTrack(track);

    return this.prisma.event.findMany({
      where:
        parsedTrack && parsedTrack !== Track.COMMON
          ? { track: parsedTrack }
          : undefined,
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
