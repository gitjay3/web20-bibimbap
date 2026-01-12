import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto) {
    // TODO: 인증 로직 수정
    const TEMP_USER_ID = 'system-admin';

    const { title, description, startTime, endTime, slotSchema, slots } = dto;

    return await this.prisma.event.create({
      data: {
        title,
        description,
        startTime,
        endTime,
        slotSchema,
        creatorId: TEMP_USER_ID,

        EventSlot: {
          create: slots.map((slot) => ({
            maxCapacity: slot.maxCapacity,
            extraInfo: slot.extraInfo,
            slotStartTime: slot.slotStartTime,
            slotEndTime: slot.slotEndTime,
          })),
        },
      },
      include: {
        EventSlot: true,
      },
    });
  }
}
