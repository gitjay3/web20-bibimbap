/**
 * k6 테스트 환경 설정
 *
 * 사용법:
 *   k6 run -e K6_ENV=local script.js
 *   k6 run -e K6_ENV=production script.js
 */

// 환경별 설정
export const environments = {
  local: {
    baseUrl: 'http://localhost:80',
    eventId: 1,
    organizationId: 1,
  },
  production: {
    baseUrl: 'https://bookstcamp.duckdns.org',
    eventId: 1,
    organizationId: 1,
  },
};

// 현재 환경 선택
const ENV = __ENV.K6_ENV || 'local';
export const config = environments[ENV];

// 성능 임계값 (thresholds)
export const defaultThresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95%는 500ms, 99%는 1000ms 이내
  http_req_failed: ['rate<0.01'],                  // 실패율 1% 미만
};

// 부하 테스트 시나리오 옵션
export const scenarios = {
  // 스모크 테스트 - 기본 동작 확인
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '10s',
  },

  // 부하 테스트 - 점진적 증가
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 10 },  // ramp-up
      { duration: '1m', target: 10 },   // steady
      { duration: '30s', target: 0 },   // ramp-down
    ],
  },

  // 스트레스 테스트 - 고부하
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 50 },
      { duration: '1m', target: 50 },
      { duration: '30s', target: 100 },
      { duration: '1m', target: 100 },
      { duration: '30s', target: 0 },
    ],
  },

  // 스파이크 테스트 - 선착순 예약 시뮬레이션
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '10s', target: 5 },
      { duration: '5s', target: 200 },   // 갑자기 200명 동시 접속
      { duration: '30s', target: 200 },
      { duration: '10s', target: 5 },
      { duration: '30s', target: 0 },
    ],
  },

  // 일정 요청률 테스트 - RPS 기준
  constantRate: {
    executor: 'constant-arrival-rate',
    rate: 100,           // 초당 100 요청
    timeUnit: '1s',
    duration: '1m',
    preAllocatedVUs: 50,
    maxVUs: 200,
  },
};
