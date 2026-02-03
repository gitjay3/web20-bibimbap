/**
 * 예약에 포함된 사용자 정보 타입
 */
export interface ReservationUser {
  user: {
    name: string | null;
    username: string;
    avatarUrl: string | null;
  };
}
