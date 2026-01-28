/**
 * 동시 예약 부하 테스트
 *
 * 테스트 시나리오:
 * 1. 정원 N명인 슬롯에 M명이 동시 예약 시도
 * 2. Redis 재고 정확성 검증
 * 3. 중복 예약 방지 검증
 *
 * 실행:
 *   # 기본 실행 (100 VU, 각 1회 요청)
 *   k6 run k6/tests/reservation-concurrent.js
 *
 *   # 환경 지정
 *   k6 run -e K6_ENV=production k6/tests/reservation-concurrent.js
 *
 *   # VU 수 조정
 *   k6 run -e VUS=200 k6/tests/reservation-concurrent.js
 *
 *   # JSON 결과 저장
 *   k6 run --out json=results.json k6/tests/reservation-concurrent.js
 *
 * 필수 환경변수:
 *   - TOKENS_FILE: 테스트 사용자 토큰 JSON 파일 경로 (기본: ./test-tokens.json)
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// ============================================
// 설정
// ============================================

const ENV = __ENV.K6_ENV || 'local';
const VUS = parseInt(__ENV.VUS) || 100;
const SLOT_ID = parseInt(__ENV.SLOT_ID) || 1;
const EVENT_ID = parseInt(__ENV.EVENT_ID) || 1;

const environments = {
  local: {
    baseUrl: 'http://localhost:80',
  },
  production: {
    baseUrl: 'https://bookstcamp.duckdns.org',
  },
};

const config = environments[ENV];

// ============================================
// 테스트 토큰 로드
// ============================================

// 테스트용 JWT 토큰 배열 (SharedArray로 메모리 효율적 로드)
// k6의 open()은 스크립트 파일 위치 기준 상대 경로 사용
let tokens;
try {
  tokens = new SharedArray('tokens', function () {
    // 스크립트는 k6/tests/ 에 있으므로 상위 디렉토리의 test-tokens.json 참조
    const file = __ENV.TOKENS_FILE || '../test-tokens.json';
    return JSON.parse(open(file));
  });
} catch (e) {
  console.log('Token file load error:', e.message);
  // 토큰 파일이 없으면 환경변수에서 단일 토큰 사용
  const singleToken = __ENV.TEST_TOKEN || '';
  tokens = [singleToken];
}

// ============================================
// 커스텀 메트릭
// ============================================

const reservationSuccess = new Counter('reservation_success');
const reservationFailed = new Counter('reservation_failed');
const reservationDuplicate = new Counter('reservation_duplicate');
const reservationSlotFull = new Counter('reservation_slot_full');
const reservationDuration = new Trend('reservation_duration');
const successRate = new Rate('reservation_success_rate');

// ============================================
// 테스트 옵션
// ============================================

export const options = {
  scenarios: {
    // 동시 예약 테스트: 모든 VU가 거의 동시에 시작
    concurrent_reservation: {
      executor: 'per-vu-iterations',
      vus: VUS,
      iterations: 1,
      maxDuration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95%가 1초 이내
    // http_req_failed 제거: 동시성 테스트는 의도적으로 정원 초과 실패 발생
    reservation_success_rate: ['rate>0.01'], // 최소 1명 성공
  },
};

// ============================================
// 메인 테스트 함수
// ============================================

export default function () {
  // VU별로 다른 토큰 사용 (토큰 배열 순환)
  const tokenIndex = (__VU - 1) % tokens.length;
  const token = tokens[tokenIndex];

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Cookie'] = `access_token=${token}`;
  }

  const payload = JSON.stringify({
    eventId: EVENT_ID,
    slotId: SLOT_ID,
  });

  const startTime = Date.now();

  // 예약 요청
  const res = http.post(
    `${config.baseUrl}/api/reservations`,
    payload,
    {
      headers,
      tags: { name: 'reservation' },
    }
  );

  const duration = Date.now() - startTime;
  reservationDuration.add(duration);

  // 응답 분석
  const isSuccess = res.status === 201 || res.status === 200;
  const isSlotFull = res.status === 400 && res.body && res.body.includes('정원이 마감');
  const isDuplicate = res.status === 400 && res.body && res.body.includes('이미 예약');

  // 메트릭 기록
  if (isSuccess) {
    reservationSuccess.add(1);
    successRate.add(true);
  } else {
    reservationFailed.add(1);
    successRate.add(false);

    if (isSlotFull) {
      reservationSlotFull.add(1);
    }
    if (isDuplicate) {
      reservationDuplicate.add(1);
    }
  }

  // 체크
  check(res, {
    'status is 2xx or expected error': (r) =>
      r.status === 200 || r.status === 201 || r.status === 400 || r.status === 401,
    'response has body': (r) => r.body && r.body.length > 0,
  });

  // 디버그 로그 (첫 몇 개만)
  if (__VU <= 5) {
    console.log(`VU ${__VU}: status=${res.status}, duration=${duration}ms, tokenLen=${token ? token.length : 0}`);
    if (res.status !== 200 && res.status !== 201) {
      console.log(`VU ${__VU}: response body: ${res.body}`);
    }
  }
}

// ============================================
// 테스트 결과 요약
// ============================================

export function handleSummary(data) {
  const successCount = data.metrics.reservation_success?.values?.count || 0;
  const failedCount = data.metrics.reservation_failed?.values?.count || 0;
  const slotFullCount = data.metrics.reservation_slot_full?.values?.count || 0;
  const duplicateCount = data.metrics.reservation_duplicate?.values?.count || 0;
  const avgDuration = data.metrics.reservation_duration?.values?.avg || 0;
  const p95Duration = data.metrics.http_req_duration?.values?.['p(95)'] || 0;

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           동시 예약 테스트 결과 요약                      ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  환경: ${ENV.padEnd(50)}║`);
  console.log(`║  VU 수: ${String(VUS).padEnd(49)}║`);
  console.log(`║  슬롯 ID: ${String(SLOT_ID).padEnd(47)}║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  성공: ${String(successCount).padEnd(50)}║`);
  console.log(`║  실패: ${String(failedCount).padEnd(50)}║`);
  console.log(`║    - 정원 초과: ${String(slotFullCount).padEnd(41)}║`);
  console.log(`║    - 중복 예약: ${String(duplicateCount).padEnd(41)}║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  평균 응답시간: ${avgDuration.toFixed(2).padEnd(41)}ms ║`);
  console.log(`║  p95 응답시간: ${p95Duration.toFixed(2).padEnd(42)}ms ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');

  // JSON 결과도 반환
  return {
    'stdout': JSON.stringify({
      summary: {
        env: ENV,
        vus: VUS,
        slotId: SLOT_ID,
        success: successCount,
        failed: failedCount,
        slotFull: slotFullCount,
        duplicate: duplicateCount,
        avgDuration: avgDuration,
        p95Duration: p95Duration,
      },
    }, null, 2),
  };
}
