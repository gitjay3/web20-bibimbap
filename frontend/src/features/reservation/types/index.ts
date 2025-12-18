// 예약 요청
export interface ReservationRequest {
  eventId: string;
  userId: string;
  slotId: number;
}

// 예약 응답
export interface ReservationResponse {
  success: boolean;
  message: string;
  reservationId?: string;
}

export interface SlotInfo {
  id: number;
  dateLabel: string;
  timeLabel: string;
  reviewer: string;
  location?: string;
  currentCount: number;
  maxCapacity: number;
}

export interface SlotCapacitySnapshot {
  slotId: number;
  currentCount: number;
  maxCapacity: number;
}

// 실시간 정원 업데이트
export interface CapacityUpdateEvent {
  snapshot: SlotCapacitySnapshot[];
  updatedSlotId?: number;
  eventId?: string;
}

// 예약 상태

// 예약 결과
