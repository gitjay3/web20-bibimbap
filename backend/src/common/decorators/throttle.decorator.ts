import { Throttle } from '@nestjs/throttler';

/**
 * 예약 엔드포인트용 Rate Limiting 데코레이터
 * - 매크로/봇의 연속 예약 시도 방지
 * - 유저 ID 기반으로 적용됨 (IP 우회 불가)
 * - 초당 3회: 사람은 이 속도로 클릭하기 어려움, 매크로만 차단
 */
export const ThrottleReservation = () =>
  Throttle({
    short: { limit: 5, ttl: 1000 }, // 초당 5회
    medium: { limit: 30, ttl: 60000 }, // 분당 30회
    long: { limit: 100, ttl: 600000 }, // 10분당 100회
  });

/**
 * 대기열 진입 엔드포인트용 Rate Limiting 데코레이터
 * - 대기열 재진입 시도 방지
 */
export const ThrottleQueueEnter = () =>
  Throttle({
    short: { limit: 1, ttl: 10000 }, // 10초당 1회
    medium: { limit: 3, ttl: 60000 }, // 분당 3회
    long: { limit: 10, ttl: 600000 }, // 10분당 10회
  });

/**
 * 대기열 상태 조회 엔드포인트용 Rate Limiting 데코레이터
 * - 과도한 폴링 방지 (프론트엔드 기본: 3초 간격)
 * - 멀티탭, 네트워크 재시도 고려하여 여유 있게 설정
 */
export const ThrottleQueueStatus = () =>
  Throttle({
    short: { limit: 2, ttl: 2000 }, // 2초당 2회 (멀티탭 고려)
    medium: { limit: 60, ttl: 60000 }, // 분당 60회 (3초 폴링의 3배 여유)
    long: { limit: 400, ttl: 600000 }, // 10분당 400회
  });
