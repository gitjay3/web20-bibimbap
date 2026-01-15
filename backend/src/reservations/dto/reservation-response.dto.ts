import { Reservation, Prisma, Track, ApplicationUnit } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    slot: {
      include: {
        event: true;
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

  @ApiProperty({
    description: '이벤트 트랙',
    example: 'WEB',
    enum: ['ANDROID', 'IOS', 'WEB', 'COMMON'],
    required: false,
  })
  eventTrack?: Track;

  @ApiProperty({
    description: '신청 단위',
    example: 'INDIVIDUAL',
    enum: ['INDIVIDUAL', 'TEAM'],
    required: false,
  })
  applicationUnit?: ApplicationUnit;

  @ApiProperty({
    description: '슬롯 추가 정보 (멘토, 장소 등)',
    example: { mentor: '홍길동', location: 'Zoom' },
    required: false,
  })
  extraInfo?: Record<string, unknown>;

  constructor(reservation: Reservation | ReservationWithRelations) {
    this.id = reservation.id;
    this.userId = reservation.userId;
    this.slotId = reservation.slotId;
    this.status = reservation.status;
    this.reservedAt = reservation.reservedAt;

    // 관계 데이터
    if ('slot' in reservation && reservation.slot) {
      this.eventTitle = reservation.slot.event.title;
      this.eventStartTime = reservation.slot.event.startTime;
      this.eventEndTime = reservation.slot.event.endTime;
      this.eventTrack = reservation.slot.event.track;
      this.applicationUnit = reservation.slot.event.applicationUnit;
      this.extraInfo = reservation.slot.extraInfo as Record<string, unknown>;
    }
  }
}
