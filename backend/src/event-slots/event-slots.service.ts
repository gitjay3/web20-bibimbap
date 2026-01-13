import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EventSlotsService {
  constructor(private prisma: PrismaService) {}

  async findByEventWithAvailability(eventId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        EventSlot: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('일정을 찾을 수 없습니다');
    }

    const slots = event.EventSlot.map((slot) => ({
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
    const slots = await this.prisma.eventSlot.findMany({
      where: { eventId },
      select: {
        id: true,
        currentCount: true,
        maxCapacity: true,
      },
      orderBy: { id: 'asc' },
    });

    if (slots.length === 0) {
      throw new NotFoundException('해당 이벤트의 슬롯을 찾을 수 없습니다');
    }

    return {
      slots: slots.map((slot) => ({
        slotId: slot.id,
        currentCount: slot.currentCount,
        remainingSeats: Math.max(0, slot.maxCapacity - slot.currentCount),
        isAvailable: slot.currentCount < slot.maxCapacity,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  async getAvailability(slotIds: number[]) {
    const slots = await this.prisma.eventSlot.findMany({
      where: {
        id: { in: slotIds },
      },
      select: {
        id: true,
        currentCount: true,
        maxCapacity: true,
      },
    });

    const transformedSlots = slots.map((slot) => ({
      slotId: slot.id,
      currentCount: slot.currentCount,
      remainingSeats: Math.max(0, slot.maxCapacity - slot.currentCount),
      isAvailable: slot.currentCount < slot.maxCapacity,
    }));

    return {
      slots: transformedSlots,
      timestamp: new Date().toISOString(),
    };
  }
}
