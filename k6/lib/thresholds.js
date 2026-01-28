/**
 * k6 테스트 임계값 정의
 *
 * 임계값이 충족되면 k6는 exit code 0으로 종료 (성공)
 * 실패 시 exit code 99로 종료
 */

// ==========================================
// 기본 임계값
// ==========================================

export const defaultThresholds = {
  // HTTP 응답 시간
  http_req_duration: ['p(95)<2000'], // 95%가 2초 이내

  // 예약 성공률 (최소 1건 성공)
  reservation_success_rate: ['rate>0'],

  // 서버 에러율 (1% 미만)
  error_rate: ['rate<0.01'],
};

// ==========================================
// 시나리오별 임계값
// ==========================================

export const competitionThresholds = {
  ...defaultThresholds,
  // 경쟁 테스트: 빠른 응답 필요
  http_req_duration: ['p(95)<500'],
  reservation_duration: ['p(95)<300'],
};

export const stressThresholds = {
  ...defaultThresholds,
  // 스트레스 테스트: 약간 느슨한 기준
  http_req_duration: ['p(95)<3000'],
  error_rate: ['rate<0.05'], // 5% 미만
};

export const spikeThresholds = {
  ...defaultThresholds,
  // 스파이크 테스트: 더 느슨한 기준 (순간 폭주 대응)
  http_req_duration: ['p(95)<5000'],
  error_rate: ['rate<0.1'], // 10% 미만
};

export const scenarioThresholds = {
  // 시나리오 테스트: 체크 기반
  checks: ['rate>0.9'], // 90% 이상 체크 통과
};

// ==========================================
// 임계값 선택 함수
// ==========================================

/**
 * 시나리오에 맞는 임계값 반환
 * @param {string} scenario - 시나리오 이름
 * @returns {object} 임계값 객체
 */
export function getThresholdsForScenario(scenario) {
  const thresholdMap = {
    competition: competitionThresholds,
    stress: stressThresholds,
    spike: spikeThresholds,
    soak: stressThresholds,
    scenarios: scenarioThresholds,
  };

  return thresholdMap[scenario] || defaultThresholds;
}

// ==========================================
// 커스텀 Trend 메트릭 통계 설정
// ==========================================

export const summaryTrendStats = [
  'min',
  'med',    // p50
  'avg',
  'p(90)',
  'p(95)',
  'p(99)',
  'max',
];
