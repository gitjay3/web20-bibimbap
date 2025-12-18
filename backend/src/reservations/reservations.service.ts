import { Injectable } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { UpdateSlotCapacityDto } from './dto/update-slot-capacity.dto';
import { Subject, Observable, concat, of } from 'rxjs';

interface EventMetadata {
  capacity: number;
  reservedCount: number;
  reservationStartDate: string;
  reservationEndDate: string;
  // TODO: 운영진이 설정 가능한 세부사항 늘어나면 ++
}

export interface CapacityUpdateEvent {
  snapshot: Array<{
    slotId: number;
    currentCount: number;
    maxCapacity: number;
  }>;
  updatedSlotId?: number;
  eventId?: string;
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

interface Reservation {
  id: string;
  eventId: string;
  userId: string;
  slotId: number;
  createdAt: Date;
}

interface SlotInfo {
  id: number;
  dateLabel: string;
  timeLabel: string;
  reviewer: string;
}

@Injectable()
export class ReservationsService {
  // TODO: 나중에 DB?
  // 동시성 여기서 제어해야하나? l
  private events: Map<string, Event> = new Map();
  private reservations: Map<string, Reservation> = new Map();
  private slots: SlotInfo[] = [
    {
      id: 1,
      dateLabel: '2024-12-20',
      timeLabel: '14:00 - 15:00',
      reviewer: '김멘토',
    },
    {
      id: 2,
      dateLabel: '2024-12-20',
      timeLabel: '15:00 - 16:00',
      reviewer: '이멘토',
    },
    {
      id: 3,
      dateLabel: '2024-12-21',
      timeLabel: '14:00 - 15:00',
      reviewer: '박멘토',
    },
    {
      id: 4,
      dateLabel: '2024-12-21',
      timeLabel: '15:00 - 16:00',
      reviewer: '최멘토',
    },
    {
      id: 5,
      dateLabel: '2024-12-22',
      timeLabel: '14:00 - 15:00',
      reviewer: '강멘토',
    },
  ];

  // 슬롯별 정원 관리 (slotId -> { currentCount, maxCapacity })
  private slotCapacities: Map<
    number,
    { currentCount: number; maxCapacity: number }
  > = new Map();

  // SSE 이벤트 스트림
  private capacityUpdateSubject = new Subject<CapacityUpdateEvent>();
  public capacityUpdate$ = this.capacityUpdateSubject.asObservable();

  constructor() {
    // 테스트용 Mock
    this.events.set('event-1', {
      id: 'event-1',
      title: '시니어 리뷰 세션',
      author: '운영진',
      description: '시니어 개발자와의 1:1 리뷰',
      date: '2025-12-20',
      category: 'review',
      metadata: {
        capacity: 10,
        reservedCount: 0,
        reservationStartDate: '2025-12-01T00:00:00Z',
        reservationEndDate: '2025-12-31T23:59:59Z',
      },
      createdAt: new Date(),
    });

    this.events.set('event-2', {
      id: 'event-2',
      title: '오프라인 네트워킹',
      author: '운영진',
      description: '캠퍼들과의 오프라인 모임',
      date: '2025-12-25',
      category: 'off',
      metadata: {
        capacity: 5,
        reservedCount: 5, // 마감
        reservationStartDate: '2025-12-01T00:00:00Z',
        reservationEndDate: '2025-12-31T23:59:59Z',
      },
      createdAt: new Date(),
    });

    // 테스트용 슬롯 정원 초기화 (프론트엔드의 SlotItem과 매칭)
    this.slotCapacities.set(1, { currentCount: 0, maxCapacity: 2 });
    this.slotCapacities.set(2, { currentCount: 1, maxCapacity: 1 }); // 마감
    this.slotCapacities.set(3, { currentCount: 1, maxCapacity: 2 });
    this.slotCapacities.set(4, { currentCount: 0, maxCapacity: 2 });
    this.slotCapacities.set(5, { currentCount: 0, maxCapacity: 1 });
  }

  /**
   * 슬롯별 정원 정보 조회
   */
  getSlotCapacity(
    slotId: number,
  ): { currentCount: number; maxCapacity: number } | null {
    return this.slotCapacities.get(slotId) || null;
  }

  /**
   * 모든 슬롯의 정원 정보 조회
   */
  getAllSlotCapacities(): Array<{
    slotId: number;
    currentCount: number;
    maxCapacity: number;
  }> {
    return Array.from(this.slotCapacities.entries()).map(
      ([slotId, capacity]) => ({
        slotId,
        currentCount: capacity.currentCount,
        maxCapacity: capacity.maxCapacity,
      }),
    );
  }

  /**
   * 슬롯 기본 정보 + 현재 정원 상태
   */
  getSlots() {
    return this.slots.map((slot) => {
      const capacity = this.slotCapacities.get(slot.id);
      return {
        ...slot,
        currentCount: capacity?.currentCount ?? 0,
        maxCapacity: capacity?.maxCapacity ?? 0,
      };
    });
  }

  /**
   * 초기 정원 상태와 이후 변동을 모두 포함한 SSE 스트림
   */
  getCapacityUpdates(): Observable<CapacityUpdateEvent> {
    const initialEvent = this.buildCapacitySnapshot();
    // 첫 연결 시 전체 슬롯 스냅샷을 전달
    return concat(of(initialEvent), this.capacityUpdate$);
  }

  /**
   * 정원 변경 이벤트 발행
   */
  private emitCapacityUpdate(slotId: number, eventId?: string): void {
    const snapshot = this.buildCapacitySnapshot(slotId, eventId);
    this.capacityUpdateSubject.next(snapshot);
  }

  /**
   * 현재 슬롯 정원 전체 스냅샷 생성
   */
  private buildCapacitySnapshot(
    updatedSlotId?: number,
    eventId?: string,
  ): CapacityUpdateEvent {
    return {
      snapshot: this.getAllSlotCapacities(),
      updatedSlotId,
      eventId,
    };
  }

  /**
   * 사용자의 기존 예약 찾기
   */
  private findUserReservation(
    userId: string,
    eventId: string,
  ): { reservationId: string; slotId: number } | null {
    for (const [reservationId, reservation] of this.reservations.entries()) {
      if (reservation.userId === userId && reservation.eventId === eventId) {
        return { reservationId, slotId: reservation.slotId };
      }
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async createReservation(
    //캠퍼가 예약 신청
    createReservationDto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    const { eventId, userId, slotId } = createReservationDto;

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

    // 기존 예약 확인
    const existingReservation = this.findUserReservation(userId, eventId);
    const previousSlotId = existingReservation?.slotId;

    // 새 슬롯별 정원 확인
    const slotCapacity = this.slotCapacities.get(slotId);
    if (!slotCapacity) {
      return {
        success: false,
        message: '존재하지 않는 슬롯입니다.',
      };
    }

    // 같은 슬롯으로 예약 수정하는 경우는 그냥 성공 처리
    if (previousSlotId === slotId && existingReservation) {
      return {
        success: true,
        message: '예약이 이미 해당 슬롯으로 설정되어 있습니다.',
        reservationId: existingReservation.reservationId,
      };
    }

    // 새 슬롯이 마감되었는지 확인
    if (slotCapacity.currentCount >= slotCapacity.maxCapacity) {
      return {
        success: false,
        message: '예약이 마감되었습니다.',
      };
    }

    let finalReservationId: string;

    // 기존 예약이 있으면 이전 슬롯 정원 감소
    if (existingReservation && previousSlotId !== undefined) {
      const previousSlotCapacity = this.slotCapacities.get(previousSlotId);
      if (previousSlotCapacity) {
        previousSlotCapacity.currentCount = Math.max(
          0,
          previousSlotCapacity.currentCount - 1,
        );
        this.emitCapacityUpdate(previousSlotId, eventId);
      }
      // 기존 예약 업데이트
      const reservation = this.reservations.get(
        existingReservation.reservationId,
      );
      if (reservation) {
        reservation.slotId = slotId;
      }
      finalReservationId = existingReservation.reservationId;
    } else {
      // 새 예약 생성
      finalReservationId = `reservation-${Date.now()}`;
      this.reservations.set(finalReservationId, {
        id: finalReservationId,
        eventId,
        userId,
        slotId,
        createdAt: new Date(),
      });
    }

    // 새 슬롯 정원 증가 및 이벤트 발행
    slotCapacity.currentCount++;
    event.metadata.reservedCount++;
    this.emitCapacityUpdate(slotId, eventId);

    return {
      success: true,
      message: existingReservation
        ? '예약이 수정되었습니다.'
        : '예약이 완료되었습니다.',
      reservationId: finalReservationId,
    };
  }

  /**
   * 슬롯 정원 변경 (테스트용)
   */
  updateSlotCapacity(
    slotId: number,
    { currentCount, maxCapacity, eventId }: UpdateSlotCapacityDto,
  ) {
    if (Number.isNaN(slotId)) {
      return {
        success: false,
        message: '유효하지 않은 슬롯 ID입니다.',
      };
    }

    const existingCapacity = this.slotCapacities.get(slotId);
    const nextMaxCapacity = maxCapacity ?? existingCapacity?.maxCapacity ?? 0;

    if (nextMaxCapacity <= 0) {
      return {
        success: false,
        message: 'maxCapacity는 1 이상이어야 합니다.',
      };
    }

    const nextCurrentCount = (() => {
      const rawCount = currentCount ?? existingCapacity?.currentCount ?? 0;
      if (rawCount < 0) return 0;
      if (rawCount > nextMaxCapacity) return nextMaxCapacity;
      return rawCount;
    })();

    this.slotCapacities.set(slotId, {
      currentCount: nextCurrentCount,
      maxCapacity: nextMaxCapacity,
    });
    this.emitCapacityUpdate(slotId, eventId);

    return {
      success: true,
      message: '슬롯 정원이 업데이트되었습니다.',
      slotId,
      currentCount: nextCurrentCount,
      maxCapacity: nextMaxCapacity,
    };
  }
}
