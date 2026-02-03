/**
 * k6 테스트 공통 설정
 */

// 환경변수에서 설정 로드
export const ENV = __ENV.K6_ENV || "local";
export const SCENARIO = __ENV.SCENARIO || "competition";
export const SLOT_ID = parseInt(__ENV.SLOT_ID) || 100;
export const EVENT_ID = parseInt(__ENV.EVENT_ID) || 100;

// 환경별 설정 (vCPU 2개, RAM 8GB 서버 기준)
const environments = {
  local: {
    baseUrl: "http://localhost:80",
    timeout: "60s", // 10s → 60s (Connection Pool 15개 기준 처리 시간 고려)
  },
  staging: {
    baseUrl: "https://bookstcamp-staging.duckdns.org",
    timeout: "30s",
  },
  production: {
    baseUrl: "https://bookstcamp.duckdns.org",
    timeout: "30s", // 20s → 30s (프로덕션 여유 확보)
  },
};

export const config = environments[ENV] || environments.local;

// Apdex 설정 (사용자 만족도 측정)
export const APDEX_T = 200; // 만족 기준 (ms)

// 시나리오 정의
export const scenarios = {
  // 경쟁 테스트: 200명이 5자리 경쟁 (40:1)
  competition: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "5s", target: 200 },
      { duration: "10s", target: 200 },
      { duration: "5s", target: 0 },
    ],
    tags: { scenario_type: "competition" },
  },

  // 스트레스 테스트: 5000 VU 고부하
  stress: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "10s", target: 2500 },
      { duration: "10s", target: 5000 },
      { duration: "30s", target: 5000 },
      { duration: "10s", target: 0 },
    ],
    tags: { scenario_type: "stress" },
  },

  // 스파이크 테스트: 10000 VU 순간 폭주
  spike: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "2s", target: 100 },
      { duration: "3s", target: 10000 },
      { duration: "10s", target: 10000 },
      { duration: "5s", target: 100 },
      { duration: "5s", target: 0 },
    ],
    tags: { scenario_type: "spike" },
  },

  // 지속 부하 테스트
  soak: {
    executor: "constant-vus",
    vus: 500,
    duration: "5m",
    tags: { scenario_type: "soak" },
  },
};

export const scenarioMeta = {
  competition: { maxPolls: 10 },
  stress: { maxPolls: 20 },
  spike: { maxPolls: 30 },
  soak: { maxPolls: 20 },
};

// 기본 HTTP 요청 파라미터
export const defaultParams = {
  timeout: config.timeout,
  tags: { env: ENV },
};
