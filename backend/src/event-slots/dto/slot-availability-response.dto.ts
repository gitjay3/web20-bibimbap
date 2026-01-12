import { ApiProperty } from '@nestjs/swagger';

export class SlotAvailabilityDto {
  // 이벤트 개별 슬롯 (각 이벤트 정보)
  @ApiProperty({
    description: '슬롯 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '최대 정원',
    example: 10,
  })
  maxCapacity: number;

  @ApiProperty({
    description: '현재 예약 수',
    example: 7,
  })
  currentCount: number;

  @ApiProperty({
    description: '남은 좌석',
    example: 3,
  })
  remainingSeats: number;

  @ApiProperty({
    description: '예약 가능 여부',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: '슬롯 추가 정보',
    example: {
      slotTime: '2025-01-12T11:30:00Z',
      mentor: '크롱',
    },
  })
  extraInfo: any;
}

export class EventSlotsResponseDto {
  // 초기 로드 시 불러오는 전체 슬롯
  @ApiProperty({
    description: '이벤트 ID',
    example: 1,
  })
  eventId: number;

  @ApiProperty({
    description: '이벤트 제목',
    example: '부스트캠프 멘토링',
  })
  eventTitle: string;

  @ApiProperty({
    description: '슬롯 목록',
    type: [SlotAvailabilityDto],
  })
  slots: SlotAvailabilityDto[];
}

export class AvailabilityOnlyResponseDto {
  // 이후 실시간 갱신 정보
  @ApiProperty({
    description: '슬롯 정원 정보',
    example: [
      {
        slotId: 1,
        currentCount: 7,
        remainingSeats: 3,
        isAvailable: true,
      },
      {
        slotId: 2,
        currentCount: 10,
        remainingSeats: 0,
        isAvailable: false,
      },
    ],
  })
  slots: Array<{
    slotId: number;
    currentCount: number;
    remainingSeats: number;
    isAvailable: boolean;
  }>;

  @ApiProperty({
    description: '조회 시각',
    example: '2025-01-12T12:00:00Z',
  })
  timestamp: string;
}
