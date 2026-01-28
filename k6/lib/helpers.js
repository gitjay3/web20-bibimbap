/**
 * k6 테스트 공통 헬퍼 함수
 */
import http from 'k6/http';
import { group, sleep } from 'k6';
import { config, defaultParams } from './config.js';

// ==========================================
// HTTP 요청 헬퍼
// ==========================================

/**
 * 인증 헤더 생성
 * @param {string} token - JWT 토큰
 * @returns {object} 헤더 객체
 */
export function createAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Cookie: `access_token=${token}`,
  };
}

/**
 * 예약 요청
 * @param {string} token - JWT 토큰
 * @param {number} eventId - 이벤트 ID
 * @param {number} slotId - 슬롯 ID
 * @param {object} tags - 추가 태그
 * @returns {object} HTTP 응답
 */
export function makeReservation(token, eventId, slotId, tags = {}) {
  const url = `${config.baseUrl}/api/reservations`;
  const payload = JSON.stringify({ eventId, slotId });

  const params = {
    headers: createAuthHeaders(token),
    tags: {
      name: 'POST /api/reservations',
      endpoint: 'reservation',
      ...defaultParams.tags,
      ...tags,
    },
    timeout: defaultParams.timeout,
  };

  return http.post(url, payload, params);
}

/**
 * 예약 취소 요청
 * @param {string} token - JWT 토큰
 * @param {number} reservationId - 예약 ID
 * @param {object} tags - 추가 태그
 * @returns {object} HTTP 응답
 */
export function cancelReservation(token, reservationId, tags = {}) {
  const url = `${config.baseUrl}/api/reservations/${reservationId}`;

  const params = {
    headers: { Cookie: `access_token=${token}` },
    tags: {
      name: 'DELETE /api/reservations/:id',
      endpoint: 'cancel',
      ...defaultParams.tags,
      ...tags,
    },
    timeout: defaultParams.timeout,
  };

  return http.del(url, null, params);
}

/**
 * 내 예약 조회 요청
 * @param {string} token - JWT 토큰
 * @param {number} eventId - 이벤트 ID
 * @param {object} tags - 추가 태그
 * @returns {object} HTTP 응답
 */
export function getMyReservation(token, eventId, tags = {}) {
  const url = `${config.baseUrl}/api/reservations/my/${eventId}`;

  const params = {
    headers: { Cookie: `access_token=${token}` },
    tags: {
      name: 'GET /api/reservations/my/:eventId',
      endpoint: 'my_reservation',
      ...defaultParams.tags,
      ...tags,
    },
    timeout: defaultParams.timeout,
  };

  return http.get(url, params);
}

// ==========================================
// 그룹 래퍼 함수
// ==========================================

/**
 * 그룹으로 감싼 예약 요청 (group_duration 메트릭 생성)
 * @param {string} groupName - 그룹 이름
 * @param {Function} fn - 실행할 함수
 * @returns {*} 함수 실행 결과
 */
export function withGroup(groupName, fn) {
  return group(groupName, fn);
}

// ==========================================
// 유틸리티 함수
// ==========================================

/**
 * JSON 응답 파싱 (안전)
 * @param {string} body - 응답 본문
 * @returns {object|null} 파싱된 객체 또는 null
 */
export function safeParseJSON(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/**
 * 예약 ID 조회 (재시도 포함)
 * 예약이 비동기(BullMQ)로 처리되므로 CONFIRMED 상태가 될 때까지 대기
 * @param {string} token - JWT 토큰
 * @param {number} eventId - 이벤트 ID
 * @param {number} maxRetries - 최대 재시도 횟수
 * @param {number} delayMs - 재시도 간격 (ms)
 * @returns {number|null} 예약 ID 또는 null
 */
export function getReservationIdWithRetry(token, eventId, maxRetries = 10, delayMs = 300) {
  for (let i = 0; i < maxRetries; i++) {
    // high cardinality 방지: 동적 인덱스 대신 고정 태그 사용
    const res = getMyReservation(token, eventId, { step: 'get_my_retry' });
    if (res.status === 200) {
      const body = safeParseJSON(res.body);
      // 예약 ID가 있고 취소되지 않은 예약만 반환
      if (body?.id && body?.status !== 'CANCELLED') {
        return body.id;
      }
    }
    sleep(delayMs / 1000);
  }
  return null;
}

/**
 * 랜덤 sleep (think time 시뮬레이션)
 * @param {number} min - 최소 시간 (초)
 * @param {number} max - 최대 시간 (초)
 */
export function randomSleep(min = 0.1, max = 0.5) {
  sleep(min + Math.random() * (max - min));
}

/**
 * VU 인덱스 기반 토큰 선택 (순환)
 * @param {Array} tokens - 토큰 배열
 * @param {number} vuId - VU ID
 * @returns {string} 선택된 토큰
 */
export function getTokenForVU(tokens, vuId) {
  if (!tokens || tokens.length === 0) {
    return null;
  }
  return tokens[(vuId - 1) % tokens.length];
}
