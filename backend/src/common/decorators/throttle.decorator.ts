import { Throttle } from '@nestjs/throttler';
import { SetMetadata, applyDecorators } from '@nestjs/common';

/**
 * Throttle 키 타입 메타데이터 키
 */
export const THROTTLE_KEY_TYPE = 'throttle_key_type';

/**
 * Throttle 키 생성 방식
 * - 'user': user:{userId} (기본값)
 * - 'user:event': user:{userId}:event:{eventId} (이벤트별 분리)
 * - 'user:slot': user:{userId}:slot:{slotId} (슬롯별 분리)
 * - 'ip': ip:{ip} (IP 기반, 로그인 등 미인증 엔드포인트용)
 */
export type ThrottleKeyType = 'user' | 'user:event' | 'user:slot' | 'ip';

/**
 * 예약 엔드포인트용 Rate Limiting 데코레이터
 * - 매크로/봇의 연속 예약 시도 방지
 * - 유저 ID + 슬롯 ID 기반으로 적용
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
 * - 유저 ID + 이벤트 ID 기반으로 적용
 */
export const ThrottleQueueEnter = () =>
  applyDecorators(
    SetMetadata(THROTTLE_KEY_TYPE, 'user:event' as ThrottleKeyType),
    Throttle({
      short: { limit: 8, ttl: 10000 }, // 10초당 8회
      medium: { limit: 20, ttl: 60000 }, // 분당 20회
      long: { limit: 40, ttl: 600000 }, // 10분당 40회
    }),
  );

/**
 * 대기열 상태 조회 엔드포인트용 Rate Limiting 데코레이터
 * - 과도한 폴링 방지 (프론트엔드 기본: 3초 간격)
 * - 유저 ID + 이벤트 ID 기반으로 적용
 */
export const ThrottleQueueStatus = () =>
  applyDecorators(
    SetMetadata(THROTTLE_KEY_TYPE, 'user:event' as ThrottleKeyType),
    Throttle({
      short: { limit: 2, ttl: 3000 }, // 3초당 2회
      medium: { limit: 100, ttl: 60000 }, // 분당 100회
      long: { limit: 700, ttl: 600000 }, // 10분당 700회
    }),
  );

/**
 * 폴링 엔드포인트용 Rate Limiting 데코레이터
 * - 슬롯 조회, 내 예약 조회 등 1초 간격 폴링 API에 적용
 * - 유저 ID + 이벤트 ID 기반으로 적용
 */
export const ThrottlePolling = () =>
  applyDecorators(
    SetMetadata(THROTTLE_KEY_TYPE, 'user:event' as ThrottleKeyType),
    Throttle({
      short: { limit: 6, ttl: 1000 }, // 초당 6회
      medium: { limit: 40, ttl: 60000 }, // 분당 40회
      long: { limit: 240, ttl: 600000 }, // 10분당 240회
    }),
  );
