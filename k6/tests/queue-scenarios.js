/**
 * 대기열 시나리오 테스트
 *
 * 테스트 케이스:
 * 1. 대기열 진입 후 상태 확인 - 진입 후 position/inQueue/sessionId 검증
 * 2. 중복 진입 멱등성 검증 - 같은 유저가 두 번 진입 시도 시 isNew=false
 * 3. 대기열 → 토큰 → 예약 전체 플로 - E2E 흐름 검증
 *
 * 실행:
 *   pnpm k6:queue:logic
 */
import { check, sleep, group } from "k6";
import { SharedArray } from "k6/data";

// 공통 모듈 임포트
import { EVENT_ID, SLOT_ID } from "../lib/config.js";
import {
  enterQueue,
  getQueueStatus,
  makeReservation,
  safeParseJSON,
} from "../lib/helpers.js";
import { queueScenarioThresholds } from "../lib/thresholds.js";
import { handleSummaryReport } from "../lib/summary.js";

// ==========================================
// 테스트 데이터 로드
// ==========================================

const tokens = new SharedArray("tokens", function () {
  try {
    return JSON.parse(open("../test-tokens.json"));
  } catch (e) {
    console.error(
      "토큰 파일을 찾을 수 없습니다. pnpm k6:queue:logic 실행 필요",
    );
    return [];
  }
});

// ==========================================
// 테스트 옵션
// ==========================================

export const options = {
  scenarios: {
    // 시나리오 1: 대기열 진입 후 상태 확인
    queue_enter_status: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 1,
      exec: "testQueueEnterAndStatus",
      startTime: "0s",
      tags: { test_case: "queue_enter_status" },
    },
    // 시나리오 2: 중복 진입 멱등성 검증
    queue_duplicate_enter: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 1,
      exec: "testQueueDuplicateEnter",
      startTime: "5s",
      tags: { test_case: "queue_duplicate_enter" },
    },
    // 시나리오 3: 대기열 → 토큰 → 예약 전체 플로
    queue_to_reservation: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 1,
      exec: "testQueueToReservation",
      startTime: "10s",
      tags: { test_case: "queue_to_reservation" },
    },
  },
  thresholds: queueScenarioThresholds,
};

// ==========================================
// 시나리오 1: 대기열 진입 후 상태 확인
// ==========================================

export function testQueueEnterAndStatus() {
  group("대기열 진입 후 상태 확인", function () {
    console.log("\n========================================");
    console.log("시나리오 1: 대기열 진입 후 상태 확인");
    console.log("========================================");

    const token = tokens[0];
    if (!token) {
      console.error("토큰이 없습니다");
      return;
    }

    // 대기열 진입
    console.log("대기열 진입...");
    const enterRes = enterQueue(token, EVENT_ID, { step: "enter" });
    const enterSuccess = check(enterRes, {
      "진입 성공 (2xx)": (r) => r.status === 200 || r.status === 201,
      "진입 응답에 position 포함": (r) => {
        const body = safeParseJSON(r.body);
        return body?.data?.position !== undefined;
      },
      "진입 응답에 sessionId 포함": (r) => {
        const body = safeParseJSON(r.body);
        return body?.data?.sessionId !== undefined;
      },
    });
    console.log(`진입 결과: status=${enterRes.status}, body=${enterRes.body}`);

    if (!enterSuccess) {
      console.log("대기열 진입 실패 - 상태 조회 스킵");
      return;
    }

    sleep(0.5);

    // 상태 조회
    console.log("대기열 상태 조회...");
    const statusRes = getQueueStatus(token, EVENT_ID, { step: "status" });
    const statusBody = safeParseJSON(statusRes.body);
    const hasToken = statusBody?.data?.hasToken === true;
    const inQueue = statusBody?.data?.inQueue === true;
    const positionDefined =
      statusBody?.data?.position !== null &&
      statusBody?.data?.position !== undefined;

    check(statusRes, {
      "상태 조회 성공 (200)": (r) => r.status === 200,
      "상태 응답에 totalWaiting 포함": () =>
        statusBody?.data?.totalWaiting !== undefined,
      "상태 응답에 hasToken 포함": () =>
        statusBody?.data?.hasToken !== undefined,
      "상태 응답에 inQueue 포함": () =>
        statusBody?.data?.inQueue !== undefined,
      "inQueue 또는 hasToken": () => inQueue || hasToken,
      "inQueue일 때 position 포함": () => !inQueue || positionDefined,
    });
    console.log(
      `상태 조회 결과: status=${statusRes.status}, body=${statusRes.body}`,
    );
    if (hasToken) {
      console.log("✓ 토큰 발급됨 - 상태 확인 테스트 통과");
    } else if (inQueue) {
      console.log("✓ 대기열 진입 후 상태 확인 테스트 통과");
    } else {
      console.log("✗ 대기열 상태 확인 테스트 실패");
    }
  });
}

// ==========================================
// 시나리오 2: 중복 진입 멱등성 검증
// ==========================================

export function testQueueDuplicateEnter() {
  group("중복 진입 멱등성 검증", function () {
    console.log("\n========================================");
    console.log("시나리오 2: 중복 진입 멱등성 검증");
    console.log("========================================");

    // 시나리오 1과 다른 유저 사용
    const token = tokens[10];
    if (!token) {
      console.error("토큰이 부족합니다");
      return;
    }

    // 1차 진입
    console.log("1차 대기열 진입...");
    const res1 = enterQueue(token, EVENT_ID, { step: "first_enter" });
    check(res1, {
      "1차 진입 성공 (2xx)": (r) => r.status === 200 || r.status === 201,
      "1차 진입 isNew 존재": (r) => {
        const body = safeParseJSON(r.body);
        return body?.data?.isNew !== undefined;
      },
    });
    const body1 = safeParseJSON(res1.body);
    console.log(
      `1차 진입 결과: status=${res1.status}, isNew=${body1?.data?.isNew}, position=${body1?.data?.position}`,
    );

    if (res1.status !== 200 && res1.status !== 201) {
      console.log("1차 진입 실패 - 중복 진입 테스트 스킵");
      return;
    }

    sleep(0.5);

    // 2차 진입 (중복)
    console.log("2차 대기열 진입 (중복)...");
    const res2 = enterQueue(token, EVENT_ID, { step: "duplicate_enter" });
    const dupSuccess = check(res2, {
      "2차 진입 2xx (멱등성)": (r) => r.status === 200 || r.status === 201,
      "2차 진입 isNew가 false": (r) => {
        const body = safeParseJSON(r.body);
        return body?.data?.isNew === false;
      },
    });
    const body2 = safeParseJSON(res2.body);
    console.log(
      `2차 진입 결과: status=${res2.status}, isNew=${body2?.data?.isNew}, position=${body2?.data?.position}`,
    );

    if (body1?.data?.isNew === false) {
      console.log("※ 이미 대기열에 있던 유저 - idempotent 확인");
    }

    if (dupSuccess) {
      console.log("✓ 중복 진입 멱등성 검증 테스트 통과");
    } else {
      console.log("✗ 중복 진입 멱등성 검증 테스트 실패");
    }
  });
}

// ==========================================
// 시나리오 3: 대기열 → 토큰 → 예약 전체 플로
// ==========================================

export function testQueueToReservation() {
  group("대기열 → 토큰 → 예약 전체 플로", function () {
    console.log("\n========================================");
    console.log("시나리오 3: 대기열 → 토큰 → 예약 전체 플로");
    console.log("========================================");

    // 다른 유저 사용
    const token = tokens[30];
    if (!token) {
      console.error("토큰이 부족합니다");
      return;
    }

    // 1단계: 대기열 진입
    console.log("대기열 진입...");
    const enterRes = enterQueue(token, EVENT_ID, { step: "flow_enter" });
    check(enterRes, {
      "진입 성공 (2xx)": (r) => r.status === 200 || r.status === 201,
    });
    console.log(`진입 결과: status=${enterRes.status}`);

    if (enterRes.status !== 200 && enterRes.status !== 201) {
      console.log(`대기열 진입 실패: ${enterRes.body}`);
      return;
    }

    // 2단계: 상태 폴링 → 토큰 획득 대기
    console.log("토큰 획득 대기 (폴링)...");
    let hasToken = false;
    const MAX_POLLS = 20;

    for (let i = 0; i < MAX_POLLS; i++) {
      sleep(0.5);

      const statusRes = getQueueStatus(token, EVENT_ID, { step: "flow_poll" });
      if (statusRes.status === 200) {
        const statusBody = safeParseJSON(statusRes.body);
        console.log(
          `폴링 ${i + 1}/${MAX_POLLS}: position=${statusBody?.data?.position}, hasToken=${statusBody?.data?.hasToken}`,
        );

        if (statusBody?.data?.hasToken) {
          hasToken = true;
          console.log("토큰 획득 완료");
          break;
        }
      }
    }

    check(
      { hasToken },
      {
        "토큰 획득 성공": (v) => v.hasToken === true,
      },
    );

    if (!hasToken) {
      console.log("✗ 토큰 획득 실패 - 예약 테스트 스킵");
      return;
    }

    sleep(0.5);

    // 3단계: 토큰으로 예약
    console.log("예약 요청...");
    const reserveRes = makeReservation(token, EVENT_ID, SLOT_ID, {
      step: "flow_reserve",
    });
    const reserveSuccess = check(reserveRes, {
      "예약 성공 (201)": (r) => r.status === 201,
    });
    console.log(
      `예약 결과: status=${reserveRes.status}, body=${reserveRes.body}`,
    );

    if (reserveSuccess) {
      console.log("✓ 대기열 → 토큰 → 예약 전체 플로 테스트 통과");
    } else {
      console.log("✗ 예약 실패 - 대기열 토큰 유효성 문제 확인 필요");
    }
  });
}

// ==========================================
// 기본 실행 함수
// ==========================================

export default function () {
  // scenarios 옵션이 설정되지 않은 경우 순차 실행
  testQueueEnterAndStatus();
  sleep(2);
  testQueueDuplicateEnter();
  sleep(2);
  testQueueToReservation();
}

// ==========================================
// 결과 요약
// ==========================================

export function handleSummary(data) {
  return handleSummaryReport(data);
}
