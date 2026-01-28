/**
 * 이벤트 목록/상세 API 부하 테스트
 *
 * 테스트 대상:
 * - GET /api/events - 이벤트 목록
 * - GET /api/events/:id - 이벤트 상세
 * - GET /api/events/:id/slots - 슬롯 가용성
 *
 * 실행:
 *   k6 run k6/tests/events-load.js
 *   k6 run -e K6_ENV=production k6/tests/events-load.js
 *   k6 run -e K6_SCENARIO=stress k6/tests/events-load.js
 */
import { check, sleep } from 'k6';
import { config, scenarios, defaultThresholds } from '../config.js';
import { publicGet } from '../helpers/http.js';

// 시나리오 선택
const SCENARIO = __ENV.K6_SCENARIO || 'load';

export const options = {
  scenarios: {
    events_test: scenarios[SCENARIO],
  },
  thresholds: defaultThresholds,
};

export default function () {
  const eventId = config.eventId;

  // 1. 이벤트 목록 조회
  const listRes = publicGet('/api/events');
  check(listRes, {
    'events list status 200': (r) => r.status === 200,
    'events list has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || (body.data && Array.isArray(body.data));
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);

  // 2. 이벤트 상세 조회
  const detailRes = publicGet(`/api/events/${eventId}`);
  check(detailRes, {
    'event detail status 200': (r) => r.status === 200,
    'event detail has id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined;
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);

  // 3. 슬롯 가용성 조회
  const slotsRes = publicGet(`/api/events/${eventId}/slots`);
  check(slotsRes, {
    'slots status 200': (r) => r.status === 200,
    'slots has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.slots !== undefined || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}

export function handleSummary(data) {
  console.log('\n========== 테스트 결과 요약 ==========');
  console.log(`환경: ${__ENV.K6_ENV || 'local'}`);
  console.log(`시나리오: ${SCENARIO}`);
  console.log(`총 요청 수: ${data.metrics.http_reqs.values.count}`);
  console.log(`평균 응답 시간: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`p95 응답 시간: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`p99 응답 시간: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log(`실패율: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log('=====================================\n');

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
