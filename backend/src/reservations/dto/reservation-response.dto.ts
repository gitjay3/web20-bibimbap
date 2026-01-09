import { Reservation, Prisma } from '@prisma/client';

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    EventSlot: {
      include: {
        Event: true;
      };
    };
  };
}>;

export class ReservationResponseDto {
  id: number;
  userId: string;
  slotId: number;
  status: string;
  reservedAt: Date;
  eventTitle?: string;
  eventStartTime?: Date;
  eventEndTime?: Date;

  constructor(reservation: Reservation | ReservationWithRelations | null) {
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    this.id = reservation.id;
    this.userId = reservation.userId;
    this.slotId = reservation.slotId;
    this.status = reservation.status;
    this.reservedAt = reservation.reservedAt;

    // 관계 데이터
    if ('EventSlot' in reservation && reservation.EventSlot) {
      this.eventTitle = reservation.EventSlot.Event.title;
      this.eventStartTime = reservation.EventSlot.Event.startTime;
      this.eventEndTime = reservation.EventSlot.Event.endTime;
    }
  }
}
