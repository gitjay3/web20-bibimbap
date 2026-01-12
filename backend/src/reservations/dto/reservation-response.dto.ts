import { Reservation, Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({
    description: '예약 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '사용자 ID',
    example: 'camper123',
  })
  userId: string;

  @ApiProperty({
    description: '슬롯 ID',
    example: 1,
  })
  slotId: number;

  @ApiProperty({
    description: '예약 상태',
    example: 'CONFIRMED',
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({
    description: '예약 일시',
    example: '2024-01-10T12:00:00Z',
  })
  reservedAt: Date;

  @ApiProperty({
    description: '이벤트 제목',
    example: '시니어 리뷰어 신청',
    required: false,
  })
  eventTitle?: string;

  @ApiProperty({
    description: '이벤트 시작일',
    example: '2024-03-10T00:00:00Z',
    required: false,
  })
  eventStartTime?: Date;

  @ApiProperty({
    description: '이벤트 종료일',
    example: '2024-03-15T23:59:59Z',
    required: false,
  })
  eventEndTime?: Date;

  constructor(reservation: Reservation | ReservationWithRelations) {
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
