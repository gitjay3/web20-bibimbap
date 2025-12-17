import type { ReservationRequest, ReservationResponse } from '../types';

// Mock API - 실제 백엔드 연결 전까지 사용
export const reservationApi = {
  // 예약 요청
  createReservation: async (
    request: ReservationRequest
  ): Promise<ReservationResponse> => {
    // Mock: 네트워크 지연 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock: 랜덤으로 성공/실패 시뮬레이션 (70% 성공률)
    const isSuccess = Math.random() > 0.3;

    if (isSuccess) {
      return {
        success: true,
        message: '예약이 완료되었습니다.',
        reservationId: `mock-reservation-${Date.now()}`,
      };
    } else {
      return {
        success: false,
        message: '예약 마감되었습니다. 다른 시간을 선택해주세요.',
      };
    }
  },

  // TODO: 실제 API 연결 시 아래처럼 교체
  /*
  createReservation: async (request: ReservationRequest): Promise<ReservationResponse> => {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  },
  */
};
