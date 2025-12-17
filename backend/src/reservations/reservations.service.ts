import { Injectable } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';

interface EventMetadata {
  capacity: number;
  reservedCount: number;
  reservationStartDate: string;
  reservationEndDate: string;
  // TODO: 운영진이 설정 가능한 세부사항 늘어나면 ++
}

interface Event {
  id: string;
  title: string;
  author: string;
  description?: string;
  date: string;
  category: 'off' | 'review'; // 이벤트 카테고리 ++
  metadata: EventMetadata;
  createdAt: Date;
}

@Injectable()
export class ReservationsService {
  // TODO: 나중에 DB?
  // 동시성 여기서 제어해야하나? l
  private events: Map<string, Event> = new Map();
  private reservations: Map<string, any> = new Map();

  async createReservation(
    //캠퍼가 예약 신청
    createReservationDto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    const { eventId, userId } = createReservationDto;

    const event = this.events.get(eventId);
    if (!event) {
      return {
        success: false,
        message: '존재하지 않는 이벤트입니다.',
      };
    }

    const now = new Date();
    const reservationEndDate = new Date(event.metadata.reservationEndDate);
    const reservationStartDate = new Date(event.metadata.reservationStartDate);

    if (now < reservationStartDate) {
      return {
        success: false,
        message: '예약 신청 기간이 아닙니다.',
      };
    }
    if (now > reservationEndDate) {
      return {
        success: false,
        message: '예약 신청 기간이 종료되었습니다.',
      };
    }

    if (event.metadata.reservedCount >= event.metadata.capacity) {
      return {
        success: false,
        message: '예약이 마감되었습니다.',
      };
    }

    // 중복 예약 -> 나중에 DB 쓰면 쿼리나 인덱스로 순회하면서 찾아야

    // 예약 생성
    const reservationId = `reservation-${Date.now()}`; // Date.now 하면 가끔 충돌나서 UUID 생성해서 박아도?
    this.reservations.set(reservationId, {
      id: reservationId,
      eventId,
      userId,
      createdAt: new Date(),
    });

    event.metadata.reservedCount++;

    return {
      success: true,
      message: '예약이 완료되었습니다.',
      reservationId,
    };
  }
}
