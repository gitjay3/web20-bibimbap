/**
 * 공개 라우트 상수
 * - 인증 및 Rate Limiting에서 제외되는 경로
 */
export const PUBLIC_ROUTES = {
  METRICS: '/api/metrics',
} as const;
