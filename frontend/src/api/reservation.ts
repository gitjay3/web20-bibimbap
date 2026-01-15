import type { ReservationApiResponse, ApplyReservationDto } from '@/types/BEapi';
import api from './api';

// 예약 신청
export async function applyReservation(slotId: number): Promise<ReservationApiResponse> {
  const { data } = await api.post<ReservationApiResponse>('/reservations', {
    slotId,
  } as ApplyReservationDto);
  return data;
}

// 예약 목록 조회
export async function getMyReservations(): Promise<ReservationApiResponse[]> {
  const { data } = await api.get<ReservationApiResponse[]>('/reservations');
  return data;
}

// 예약 취소
export async function cancelReservation(reservationId: number): Promise<ReservationApiResponse> {
  const { data } = await api.delete<ReservationApiResponse>(`/reservations/${reservationId}`);
  return data;
}

// 내 예약
export async function getMyReservationForEvent(
  eventId: number,
): Promise<ReservationApiResponse | null> {
  const { data } = await api.get<ReservationApiResponse | null>(`/reservations/my/${eventId}`);
  return data;
}
