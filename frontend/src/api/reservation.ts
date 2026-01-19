import type { ReservationApiResponse, ApplyReservationDto } from '@/types/BEapi';
import axios from 'axios';
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

export const createReservation = async (eventId: number, slotId: number) => {
  try {
    const response = await api.post('/reservations', { eventId, slotId });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 400 && message?.includes('정원')) {
        // 슬롯 마감 - 다른 슬롯 선택 유도
        throw new Error('SLOT_FULL');
      }
      if (status === 403) {
        // 토큰 없음 - 대기열 재진입 필요
        throw new Error('NO_TOKEN');
      }
    }
    throw error;
  }
};
