import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Track } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto) {
    // TODO: 인증 로직 수정
    // 임시: seed로 만든 INTERNAL admin user 조회
    const adminAuthAccount = await this.prisma.authAccount.findUnique({
      where: {
        provider_providerId: {
          provider: 'INTERNAL',
          providerId: 'admin',
        },
      },
      include: {
        user: true,
      },
    });

    if (!adminAuthAccount?.user) {
      throw new Error('ADMIN 계정이 존재하지 않습니다. seed를 확인하세요.');
    }

    const adminUserId = adminAuthAccount.user.id;

    const { title, description, track, startTime, endTime, slotSchema, slots } =
      dto;

    return await this.prisma.event.create({
      data: {
        title,
        description,
        track,
        startTime,
        endTime,
        slotSchema,
        creatorId: adminUserId,

        EventSlot: {
          create: slots.map((slot) => ({
            maxCapacity: slot.maxCapacity,
            extraInfo: slot.extraInfo,
          })),
        },
      },
      include: {
        EventSlot: true,
      },
    });
  }

  async findAll(track?: string) {
    const parsedTrack = this.parseTrack(track);

    return this.prisma.event.findMany({
      where:
        parsedTrack && parsedTrack !== Track.ALL
          ? { track: parsedTrack }
          : undefined,
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        track: true,
        creatorId: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        EventSlot: true,
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
