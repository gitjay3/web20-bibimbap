/**
 * 예약 시스템 부하 테스트
 *
 * 테스트 종류:
 * - competition: 치열한 경쟁 (200 VU → 5자리)
 * - stress: 고부하 스트레스 (1000 VU)
 * - spike: 순간 폭주 (5000 VU)
 * - soak: 지속 부하 (500 VU, 5분)
 *
 * 실행:
 *   pnpm k6:competition
 *   pnpm k6:stress
 *   pnpm k6:spike
 */
import { sleep } from 'k6';
import { SharedArray } from 'k6/data';

// 공통 모듈 임포트
import { SCENARIO, EVENT_ID, SLOT_ID, scenarios } from '../lib/config.js';
import { recordReservationMetrics } from '../lib/metrics.js';
import { makeReservation, getTokenForVU } from '../lib/helpers.js';
import { getThresholdsForScenario, summaryTrendStats } from '../lib/thresholds.js';
import { handleSummaryReport } from '../lib/summary.js';

// ==========================================
// 테스트 데이터 로드
// ==========================================

const tokens = new SharedArray('tokens', function () {
  try {
    const file = __ENV.TOKENS_FILE || '../test-tokens.json';
    return JSON.parse(open(file));
  } catch (e) {
    console.error(`토큰 파일 로드 실패: ${e.message}`);
    console.error('pnpm k6:setup 먼저 실행하세요.');
    return [];
  }
});

// ==========================================
// 테스트 옵션
// ==========================================

export const options = {
  scenarios: {
    load_test: {
      ...scenarios[SCENARIO],
      exec: 'reservationTest',
    },
  },
  thresholds: getThresholdsForScenario(SCENARIO),
  summaryTrendStats,

  // 메모리 최적화: 응답 바디 폐기 (상태 코드만 확인)
  discardResponseBodies: false, // 응답 파싱 필요시 false

  // HTTP 배치 설정
  batch: 20,
  batchPerHost: 6,

  // 태그 설정 (고정값만 - high cardinality 방지)
  tags: {
    testType: 'load',
    scenario: SCENARIO,
  },
};

// ==========================================
// 테스트 라이프사이클
// ==========================================

/**
 * 테스트 시작 전 셋업 (1회 실행)
 */
export function setup() {
  console.log(`\n🚀 부하 테스트 시작: ${SCENARIO}`);
  console.log(`   이벤트: ${EVENT_ID}, 슬롯: ${SLOT_ID}`);
  console.log(`   토큰 수: ${tokens.length}\n`);

  if (tokens.length === 0) {
    throw new Error('토큰이 없습니다. pnpm k6:setup 먼저 실행하세요.');
  }

  return { startTime: Date.now() };
}

/**
 * 테스트 종료 후 정리 (1회 실행)
 */
export function teardown(data) {
  const elapsed = ((Date.now() - data.startTime) / 1000).toFixed(1);
  console.log(`\n✅ 테스트 완료 (${elapsed}초)\n`);
}

// ==========================================
// 메인 테스트 함수
// ==========================================

/**
 * 예약 테스트 시나리오
 */
export function reservationTest() {
  // VU별 토큰 선택
  const token = getTokenForVU(tokens, __VU);
  if (!token) {
    console.error(`VU ${__VU}: 토큰 없음`);
    return;
  }

  // 예약 요청 (high cardinality 태그 제거 - vu/iter 사용 안함)
  const startTime = Date.now();
  const response = makeReservation(token, EVENT_ID, SLOT_ID);
  const duration = Date.now() - startTime;

  // 메트릭 기록
  recordReservationMetrics(response, duration);

  // 현실적인 사용자 행동: Think Time
  sleep(Math.random() * 0.5);
}

// ==========================================
// 결과 요약
// ==========================================

export function handleSummary(data) {
  return handleSummaryReport(data);
}

// 기본 export (scenarios 미사용 시)
export default reservationTest;
