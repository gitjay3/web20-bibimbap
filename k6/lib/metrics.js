/**
 * k6 커스텀 메트릭 정의
 *
 * 메트릭 종류:
 * - Counter: 누적 카운터 (예: 성공 횟수)
 * - Rate: 비율 (예: 성공률)
 * - Trend: 통계값 (예: 응답 시간 p50, p95, p99)
 * - Gauge: 현재 값 (예: 현재 VU 수)
 */
import { Counter, Rate, Trend } from 'k6/metrics';

// ==========================================
// 예약 결과 메트릭
// ==========================================

// 예약 성공/실패 카운터
export const reservationSuccess = new Counter('reservation_success');
export const reservationFailed = new Counter('reservation_failed');

// 실패 유형별 카운터
export const reservationSlotFull = new Counter('reservation_slot_full');
export const reservationDuplicate = new Counter('reservation_duplicate');
export const serverErrors = new Counter('server_errors');

// ==========================================
// 응답 시간 메트릭
// ==========================================

// 예약 요청 응답 시간 (p50, p90, p95, p99 자동 계산)
export const reservationDuration = new Trend('reservation_duration');

// ==========================================
// 비율 메트릭
// ==========================================

// 예약 성공률
export const successRate = new Rate('reservation_success_rate');

// 서버 에러율 (5xx만)
export const errorRate = new Rate('error_rate');

// 요청 처리율
export const requestRate = new Rate('request_rate');

// ==========================================
// Apdex 메트릭 (사용자 만족도)
// Apdex = (Satisfied + Tolerating*0.5) / Total
// T = 200ms 기준
// ==========================================

export const apdexSatisfied = new Counter('apdex_satisfied');   // <= T (200ms)
export const apdexTolerating = new Counter('apdex_tolerating'); // <= 4T (800ms)
export const apdexFrustrated = new Counter('apdex_frustrated'); // > 4T

// ==========================================
// 대기열 결과 메트릭
// ==========================================

// 대기열 진입 성공/실패 카운터
export const queueEnterSuccess = new Counter('queue_enter_success');
export const queueEnterFailed = new Counter('queue_enter_failed');

// 대기열 토큰 획득
export const queueTokenAcquired = new Counter('queue_token_acquired');
export const queueTokenAcquireRate = new Rate('queue_token_acquire_rate');

// ==========================================
// 대기열 응답 시간 메트릭
// ==========================================

// 대기열 진입 요청 응답 시간
export const queueEnterDuration = new Trend('queue_enter_duration');

// 대기열 상태 조회 응답 시간
export const queueStatusDuration = new Trend('queue_status_duration');

// ==========================================
// 메트릭 기록 헬퍼 함수
// ==========================================

/**
 * 응답 시간 기반 Apdex 기록
 * @param {number} duration - 응답 시간 (ms)
 * @param {number} threshold - Apdex T 값 (기본 200ms)
 */
export function recordApdex(duration, threshold = 200) {
  if (duration <= threshold) {
    apdexSatisfied.add(1);
  } else if (duration <= threshold * 4) {
    apdexTolerating.add(1);
  } else {
    apdexFrustrated.add(1);
  }
}

/**
 * 예약 응답 분석 및 메트릭 기록
 * @param {object} response - HTTP 응답 객체
 * @param {number} duration - 요청 소요 시간 (ms)
 */
export function recordReservationMetrics(response, duration) {
  // 응답 시간 기록
  reservationDuration.add(duration);
  requestRate.add(true);

  // Apdex 기록
  recordApdex(duration);

  // 응답 분석
  const status = response.status;
  const body = response.body || '';

  const isSuccess = status === 201 || status === 200;
  const isServerError = status >= 500;
  const isSlotFull = status === 400 && body.includes('정원');
  const isDuplicate = status === 400 && (body.includes('이미') || body.includes('팀원'));

  // 에러율 기록
  errorRate.add(isServerError);
  if (isServerError) {
    serverErrors.add(1);
  }

  // 예약 결과 기록
  if (isSuccess) {
    reservationSuccess.add(1);
    successRate.add(true);
  } else {
    reservationFailed.add(1);
    successRate.add(false);

    if (isSlotFull) reservationSlotFull.add(1);
    if (isDuplicate) reservationDuplicate.add(1);
  }

  return { isSuccess, isServerError, isSlotFull, isDuplicate };
}

/**
 * 대기열 진입 응답 분석 및 메트릭 기록
 * @param {object} response - HTTP 응답 객체
 * @param {number} duration - 요청 소요 시간 (ms)
 */
export function recordQueueEnterMetrics(response, duration) {
  // 응답 시간 기록
  queueEnterDuration.add(duration);

  // Apdex 기록
  recordApdex(duration);

  // 응답 분석
  const isSuccess = response.status === 200 || response.status === 201;
  const isServerError = response.status >= 500;

  // 에러율 기록
  errorRate.add(isServerError);
  if (isServerError) {
    serverErrors.add(1);
  }

  // 대기열 진입 결과 기록
  if (isSuccess) {
    queueEnterSuccess.add(1);
  } else {
    queueEnterFailed.add(1);
  }

  return { isSuccess, isServerError };
}

/**
 * 대기열 상태 조회 응답 분석 및 메트릭 기록
 * @param {object} response - HTTP 응답 객체
 * @param {number} duration - 요청 소요 시간 (ms)
 */
export function recordQueueStatusMetrics(response, duration) {
  // 응답 시간 기록
  queueStatusDuration.add(duration);

  // 응답 분석
  const isSuccess = response.status === 200;
  const isServerError = response.status >= 500;

  // 에러율 기록
  errorRate.add(isServerError);
  if (isServerError) {
    serverErrors.add(1);
  }

  // 토큰 획득 여부 기록
  if (isSuccess) {
    try {
      const body = JSON.parse(response.body || '{}');
      if (body?.data?.hasToken) {
        queueTokenAcquired.add(1);
        queueTokenAcquireRate.add(true);
      } else {
        queueTokenAcquireRate.add(false);
      }
    } catch {
      queueTokenAcquireRate.add(false);
    }
  }

  return { isSuccess, isServerError };
}
