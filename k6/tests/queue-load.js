/**
 * 대기열 부하 테스트
 *
 * 테스트 종류:
 * - competition: 200명이 대기열 진입 경쟁 (빠른 토큰 획득)
 * - stress: 1000명 고부하 대기열 테스트
 * - spike: 5000명 순간 폭주
 * - soak: 500명 지속 부하 (5분)
 *
 * 테스트 대상:
 * - POST /api/queue/:eventId/enter - 대기열 진입
 * - GET /api/queue/:eventId/status - 대기열 상태 폴링 → 토큰 획득
 *
 * 토큰 발급 조건:
 * - 활성 토큰 수가 BATCH_SIZE(100) 미만일 때만 토큰 발급
 * - 기존 토큰 만료/무효화 시 활성 토큰 목록에서 자동 정리
 *
 * 실행:
 *   pnpm k6:queue            - 경쟁 테스트 (기본)
 *   pnpm k6:queue:stress     - 스트레스 테스트
 *   pnpm k6:queue:spike      - 스파이크 테스트
 */
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";

// 공통 모듈 임포트
import { SCENARIO, EVENT_ID, scenarios, scenarioMeta } from "../lib/config.js";
import {
  recordQueueEnterMetrics,
  recordQueueStatusMetrics,
} from "../lib/metrics.js";
import {
  enterQueue,
  getQueueStatus,
  getTokenForVU,
  safeParseJSON,
} from "../lib/helpers.js";
import {
  getThresholdsForScenario,
  summaryTrendStats,
} from "../lib/thresholds.js";
import { handleSummaryReport } from "../lib/summary.js";

// ==========================================
// 테스트 데이터 로드
// ==========================================

const tokens = new SharedArray("tokens", function () {
  try {
    const file = __ENV.TOKENS_FILE || "../test-tokens.json";
    return JSON.parse(open(file));
  } catch (e) {
    console.error(`토큰 파일 로드 실패: ${e.message}`);
    console.error("pnpm k6:queue* 먼저 실행하세요.");
    return [];
  }
});

// VU 상태 (각 VU 런타임별로 유지)
let vuInQueue = false;
let vuHasToken = false;

const POLL_INTERVAL_BASE = 2.5;
const POLL_INTERVAL_JITTER = 1.0;
const IDLE_AFTER_TOKEN = 3;

// ==========================================
// 테스트 옵션
// ==========================================

export const options = {
  scenarios: {
    queue_load_test: {
      ...scenarios[SCENARIO],
      exec: "queueLoadTest",
    },
  },
  thresholds: getThresholdsForScenario("queue"),
  summaryTrendStats,

  // 응답 파싱 필요 (대기열 상태/토큰 확인)
  discardResponseBodies: false,

  // HTTP 배치 설정
  batch: 20,
  batchPerHost: 6,

  // 태그 설정 (고정값만 - high cardinality 방지)
  tags: {
    testType: "queue_load",
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
  console.log(`\n🚀 대기열 부하 테스트 시작: ${SCENARIO}`);
  console.log(`   이벤트: ${EVENT_ID}`);
  console.log(`   토큰 수: ${tokens.length}\n`);

  if (tokens.length === 0) {
    throw new Error("토큰이 없습니다. pnpm k6:queue* 먼저 실행하세요.");
  }

  return { startTime: Date.now() };
}

/**
 * 테스트 종료 후 정리 (1회 실행)
 */
export function teardown(data) {
  const elapsed = ((Date.now() - data.startTime) / 1000).toFixed(1);
  console.log(`\n✅ 대기열 테스트 완료 (${elapsed}초)\n`);
}

// ==========================================
// 메인 테스트 함수
// ==========================================

/**
 * 대기열 부하 테스트: 진입 + 상태 폴링 + 토큰 획득
 */
export function queueLoadTest() {
  // VU별 토큰 선택
  const token = getTokenForVU(tokens, __VU);
  if (!token) {
    console.error(`VU ${__VU}: 토큰 없음`);
    return;
  }

  // 이미 토큰이 발급된 VU는 상태만 확인하고 대기
  if (vuHasToken) {
    const statusStartTime = Date.now();
    const statusRes = getQueueStatus(token, EVENT_ID);
    const statusDuration = Date.now() - statusStartTime;

    recordQueueStatusMetrics(statusRes, statusDuration);

    if (statusRes.status === 200) {
      const statusBody = safeParseJSON(statusRes.body);
      if (statusBody?.data?.hasToken) {
        sleep(IDLE_AFTER_TOKEN);
        return;
      }

      // 토큰 만료 → 다시 진입
      vuHasToken = false;
      vuInQueue = statusBody?.data?.inQueue === true;
    } else {
      sleep(IDLE_AFTER_TOKEN);
      return;
    }
  }

  // 1단계: 대기열 진입 (이미 진입 중이면 재진입하지 않음)
  if (!vuInQueue) {
    const enterStartTime = Date.now();
    const enterRes = enterQueue(token, EVENT_ID);
    const enterDuration = Date.now() - enterStartTime;

    recordQueueEnterMetrics(enterRes, enterDuration);

    check(enterRes, {
      "queue enter status 2xx": (r) => r.status === 200 || r.status === 201,
      "queue enter has position": (r) => {
        const body = safeParseJSON(r.body);
        return body?.data?.position !== undefined;
      },
    });

    if (enterRes.status !== 200 && enterRes.status !== 201) {
      if (__VU <= 5) {
        console.log(
          `VU ${__VU}: 대기열 진입 실패 status=${enterRes.status}, body=${enterRes.body}`,
        );
      }
      sleep(0.5);
      return;
    }

    vuInQueue = true;
    const enterBody = safeParseJSON(enterRes.body);
    if (__VU <= 5) {
      console.log(
        `VU ${__VU}: 대기열 진입 완료 position=${enterBody?.data?.position}, isNew=${enterBody?.data?.isNew}`,
      );
    }
  }

  // 2단계: 상태 폴링 (프론트 useQueue와 동일한 패턴)
  // - i=0: 진입 후 즉시 조회 (프론트: enter 완료 시 바로 fetchStatus 호출)
  // - i>0: 3초 간격 폴링 (프론트 QUEUE_POLLING_INTERVAL = 3000ms)
  const MAX_POLLS = scenarioMeta[SCENARIO]?.maxPolls || 10;
  for (let i = 0; i < MAX_POLLS; i++) {
    if (i > 0) {
      sleep(POLL_INTERVAL_BASE + Math.random() * POLL_INTERVAL_JITTER); // ~3초 (±0.5s jitter)
    }

    const statusStartTime = Date.now();
    const statusRes = getQueueStatus(token, EVENT_ID);
    const statusDuration = Date.now() - statusStartTime;

    recordQueueStatusMetrics(statusRes, statusDuration);

    check(statusRes, {
      "queue status 200": (r) => r.status === 200,
      "queue status has fields": (r) => {
        const body = safeParseJSON(r.body);
        return (
          body?.data?.hasToken !== undefined &&
          body?.data?.inQueue !== undefined
        );
      },
    });

    if (statusRes.status === 200) {
      const statusBody = safeParseJSON(statusRes.body);
      if (statusBody?.data?.hasToken) {
        vuHasToken = true;
        vuInQueue = false;
        if (__VU <= 5) {
          console.log(`VU ${__VU}: 토큰 획득 완료 (폴링 ${i + 1}회)`);
        }
        break;
      }

      if (statusBody?.data?.inQueue === false) {
        // 대기열에서 이탈된 경우 다음 루프에서 재진입
        vuInQueue = false;
        if (__VU <= 5) {
          console.log(`VU ${__VU}: 대기열 이탈 - 재진입 대기`);
        }
        break;
      }
    }
  }

  if (vuHasToken) {
    sleep(IDLE_AFTER_TOKEN);
  } else {
    sleep(0.5);
  }
}

// ==========================================
// 결과 요약
// ==========================================

export function handleSummary(data) {
  return handleSummaryReport(data);
}

export default queueLoadTest;
