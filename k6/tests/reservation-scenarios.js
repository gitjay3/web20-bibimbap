/**
 * 예약 시나리오 테스트
 *
 * 테스트 케이스:
 * 1. 중복 예약 방지 - 같은 유저가 같은 슬롯에 두 번 요청
 * 2. 예약 취소 후 재예약 - 취소 후 다른 유저가 빈자리 차지
 * 3. 팀 중복 예약 방지 - 같은 팀의 다른 멤버가 예약 시도
 *
 * 실행:
 *   pnpm k6:logic       - 개인 이벤트 (EVENT_ID=100)
 *   pnpm k6:logic:team  - 팀 이벤트 (EVENT_ID=102)
 */
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';

// 공통 모듈 임포트
import { EVENT_ID, SLOT_ID } from '../lib/config.js';
import {
  makeReservation,
  cancelReservation,
  getReservationIdWithRetry,
} from '../lib/helpers.js';
import { scenarioThresholds } from '../lib/thresholds.js';
import { handleSummaryReport } from '../lib/summary.js';

// ==========================================
// 테스트 데이터 로드
// ==========================================

const tokens = new SharedArray('tokens', function () {
  try {
    return JSON.parse(open('../test-tokens.json'));
  } catch (e) {
    console.error('토큰 파일을 찾을 수 없습니다. pnpm k6:setup 실행 필요');
    return [];
  }
});

// ==========================================
// 테스트 옵션
// ==========================================

export const options = {
  scenarios: {
    // 시나리오 1: 중복 예약 방지 테스트
    duplicate_reservation: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      exec: 'testDuplicateReservation',
      startTime: '0s',
      tags: { test_case: 'duplicate' },
    },
    // 시나리오 2: 예약 취소 후 재예약 테스트
    cancel_and_rebook: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      exec: 'testCancelAndRebook',
      startTime: '5s',
      tags: { test_case: 'cancel_rebook' },
    },
    // 시나리오 3: 팀 중복 예약 방지 테스트
    team_duplicate: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      exec: 'testTeamDuplicate',
      startTime: '10s',
      tags: { test_case: 'team_duplicate' },
    },
  },
  thresholds: scenarioThresholds,
};

// ==========================================
// 시나리오 1: 중복 예약 방지
// ==========================================

export function testDuplicateReservation() {
  group('중복 예약 방지', function () {
    console.log('\n========================================');
    console.log('시나리오 1: 중복 예약 방지 테스트');
    console.log('========================================');

    const token = tokens[0];
    if (!token) {
      console.error('토큰이 없습니다');
      return;
    }

    // 1차 예약 시도
    console.log('1차 예약 시도...');
    const res1 = makeReservation(token, EVENT_ID, SLOT_ID, { step: 'first' });
    const success1 = check(res1, {
      '1차 예약 성공 (201)': (r) => r.status === 201,
    });
    console.log(`1차 결과: status=${res1.status}`);

    if (!success1) {
      console.log(`1차 예약 실패: ${res1.body}`);
    }

    sleep(0.5);

    // 2차 예약 시도 (중복)
    console.log('2차 예약 시도 (중복)...');
    const res2 = makeReservation(token, EVENT_ID, SLOT_ID, { step: 'duplicate' });
    const success2 = check(res2, {
      '2차 예약 거절 (400)': (r) => r.status === 400,
      '중복 예약 메시지': (r) => r.body && (r.body.includes('이미') || r.body.includes('already')),
    });
    console.log(`2차 결과: status=${res2.status}, body=${res2.body}`);

    if (success2) {
      console.log('✓ 중복 예약 방지 테스트 통과');
    } else {
      console.log('✗ 중복 예약 방지 테스트 실패');
    }
  });
}

// ==========================================
// 시나리오 2: 예약 취소 후 재예약
// ==========================================

export function testCancelAndRebook() {
  group('취소 후 재예약', function () {
    console.log('\n========================================');
    console.log('시나리오 2: 예약 취소 후 재예약 테스트');
    console.log('========================================');

    // 다른 그룹의 유저 사용 (팀 이벤트에서 충돌 방지)
    const token1 = tokens[50]; // 유저 1 (그룹 125)
    const token2 = tokens[60]; // 유저 2 (그룹 130) - 다른 그룹
    if (!token1 || !token2) {
      console.error('토큰이 부족합니다');
      return;
    }

    // 유저 1이 예약
    console.log('유저1 예약...');
    const res1 = makeReservation(token1, EVENT_ID, SLOT_ID, { step: 'initial' });
    console.log(`유저1 예약 결과: status=${res1.status}`);

    sleep(0.5);

    // 예약 ID 조회 (비동기 처리 대기)
    let reservationId = null;
    if (res1.status === 201) {
      reservationId = getReservationIdWithRetry(token1, EVENT_ID);
      console.log(`예약 ID 조회: ${reservationId}`);
    }

    sleep(0.5);

    // 유저 1이 취소
    if (reservationId) {
      console.log('유저1 취소...');
      const cancelRes = cancelReservation(token1, reservationId, { step: 'cancel' });
      const cancelSuccess = check(cancelRes, {
        '취소 성공 (200)': (r) => r.status === 200,
      });
      console.log(`취소 결과: status=${cancelRes.status}`);

      if (!cancelSuccess) {
        console.log(`취소 실패: ${cancelRes.body}`);
      }
    } else {
      console.log('예약 ID를 찾을 수 없어 취소 스킵');
    }

    sleep(0.5);

    // 유저 2가 재예약
    console.log('유저2 재예약...');
    const res2 = makeReservation(token2, EVENT_ID, SLOT_ID, { step: 'rebook' });
    const success2 = check(res2, {
      '재예약 성공 (201)': (r) => r.status === 201,
    });
    console.log(`유저2 재예약 결과: status=${res2.status}`);

    if (success2) {
      console.log('✓ 취소 후 재예약 테스트 통과');
    } else {
      console.log(`✗ 취소 후 재예약 테스트 실패: ${res2.body}`);
    }
  });
}

// ==========================================
// 시나리오 3: 팀 중복 예약 방지 (팀 이벤트 전용)
// ==========================================

// 팀 이벤트 ID (102)인 경우에만 팀 중복 검증
const IS_TEAM_EVENT = EVENT_ID === 102;

export function testTeamDuplicate() {
  group('팀 중복 예약 방지', function () {
    console.log('\n========================================');
    console.log(`시나리오 3: 팀 중복 예약 방지 테스트 (${IS_TEAM_EVENT ? '팀 이벤트' : '개인 이벤트'})`);
    console.log('========================================');

    // 같은 그룹의 두 유저 (TEAM_SIZE=2이므로 인덱스 20,21은 같은 그룹)
    const token1 = tokens[20]; // 팀원 1 (그룹 110)
    const token2 = tokens[21]; // 팀원 2 (그룹 110) - 같은 그룹
    if (!token1 || !token2) {
      console.error('토큰이 부족합니다');
      return;
    }

    // 팀원 1이 예약
    console.log('팀원1 예약...');
    const res1 = makeReservation(token1, EVENT_ID, SLOT_ID, { step: 'team_first' });
    const success1 = check(res1, {
      '팀원1 예약 성공 (201)': (r) => r.status === 201,
    });
    console.log(`팀원1 결과: status=${res1.status}`);

    if (!success1) {
      console.log(`팀원1 예약 실패: ${res1.body}`);
    }

    sleep(0.5);

    // 팀원 2가 같은 슬롯 예약 시도
    console.log('팀원2 예약 시도 (같은 팀)...');
    const res2 = makeReservation(token2, EVENT_ID, SLOT_ID, { step: 'team_duplicate' });
    console.log(`팀원2 결과: status=${res2.status}, body=${res2.body}`);

    if (IS_TEAM_EVENT) {
      // 팀 이벤트: 팀원2 예약이 거절되어야 함
      const success2 = check(res2, {
        '팀원2 예약 거절 (400)': (r) => r.status === 400,
        '팀 중복 메시지': (r) => r.body && (r.body.includes('팀원') || r.body.includes('team')),
      });
      if (success2) {
        console.log('✓ 팀 중복 예약 방지 테스트 통과');
      } else {
        console.log('✗ 팀 중복 예약 방지 테스트 실패');
      }
    } else {
      // 개인 이벤트: 팀원2 예약도 성공해야 함
      const success2 = check(res2, {
        '팀원2 예약 성공 (201, 개인 이벤트)': (r) => r.status === 201,
      });
      if (success2) {
        console.log('✓ 개인 이벤트 - 동일 그룹 유저 예약 허용 테스트 통과');
      } else {
        console.log('✗ 개인 이벤트 - 동일 그룹 유저 예약 테스트 실패');
      }
    }
  });
}

// ==========================================
// 기본 실행 함수
// ==========================================

export default function () {
  // scenarios 옵션이 설정되지 않은 경우 순차 실행
  testDuplicateReservation();
  sleep(2);
  testCancelAndRebook();
  sleep(2);
  testTeamDuplicate();
}

// ==========================================
// 결과 요약
// ==========================================

export function handleSummary(data) {
  return handleSummaryReport(data);
}
