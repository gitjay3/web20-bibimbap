export interface ReservationJobData {
  reservationId: number;
  userId: string;
  slotId: number;
  maxCapacity: number; // Redis 복구 시 사용
  stockDeducted: boolean;
  groupNumber: number | null;
}

export const RESERVATION_QUEUE = 'reservation-queue';
export const PROCESS_RESERVATION_JOB = 'process-reservation';
