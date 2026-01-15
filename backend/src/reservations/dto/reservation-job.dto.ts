export interface ReservationJobData {
  userId: string;
  slotId: number;
  maxCapacity: number; // Redis 복구 시 사용
}

export const RESERVATION_QUEUE = 'reservation-queue';
export const PROCESS_RESERVATION_JOB = 'process-reservation';
