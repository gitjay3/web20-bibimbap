import { Throttle } from '@nestjs/throttler';

/**
 * 로그인 엔드포인트용 Rate Limiting 데코레이터
 * - 브루트포스 공격 방지를 위한 엄격한 제한
 */
export const ThrottleLogin = () =>
  Throttle({
    short: { limit: 3, ttl: 1000 }, // 초당 3회
    medium: { limit: 5, ttl: 60000 }, // 분당 5회
    long: { limit: 10, ttl: 600000 }, // 10분당 10회
  });
