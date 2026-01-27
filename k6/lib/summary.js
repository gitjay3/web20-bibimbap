/**
 * k6 테스트 결과 요약 리포터
 */
import { ENV, SCENARIO, EVENT_ID, SLOT_ID } from './config.js';

/**
 * handleSummary에서 사용할 결과 요약 생성
 * @param {object} data - k6 메트릭 데이터
 * @returns {object} 결과 객체
 */
export function generateSummary(data) {
  // 기본 메트릭
  const totalRequests = data.metrics.http_reqs?.values?.count || 0;
  const rps = data.metrics.http_reqs?.values?.rate || 0;

  // 예약 결과
  const successCount = data.metrics.reservation_success?.values?.count || 0;
  const failedCount = data.metrics.reservation_failed?.values?.count || 0;
  const slotFullCount = data.metrics.reservation_slot_full?.values?.count || 0;
  const duplicateCount = data.metrics.reservation_duplicate?.values?.count || 0;
  const serverErrorCount = data.metrics.server_errors?.values?.count || 0;

  // 응답 시간 (커스텀 메트릭)
  const duration = data.metrics.reservation_duration?.values || {};
  const latency = {
    min: duration.min || 0,
    p50: duration.med || 0,
    p90: duration['p(90)'] || 0,
    p95: duration['p(95)'] || 0,
    p99: duration['p(99)'] || 0,
    max: duration.max || 0,
    avg: duration.avg || 0,
  };

  // Apdex 계산
  const satisfied = data.metrics.apdex_satisfied?.values?.count || 0;
  const tolerating = data.metrics.apdex_tolerating?.values?.count || 0;
  const frustrated = data.metrics.apdex_frustrated?.values?.count || 0;
  const apdexTotal = satisfied + tolerating + frustrated;
  const apdex = apdexTotal > 0
    ? ((satisfied + tolerating * 0.5) / apdexTotal)
    : null;

  // 에러율
  const errorRateValue = totalRequests > 0
    ? (serverErrorCount / totalRequests) * 100
    : 0;

  return {
    scenario: SCENARIO,
    env: ENV,
    eventId: EVENT_ID,
    slotId: SLOT_ID,
    timestamp: new Date().toISOString(),
    throughput: {
      totalRequests,
      rps: parseFloat(rps.toFixed(2)),
    },
    reservation: {
      success: successCount,
      failed: failedCount,
      slotFull: slotFullCount,
      duplicate: duplicateCount,
      serverError: serverErrorCount,
    },
    latency: {
      min: parseFloat(latency.min.toFixed(2)),
      p50: parseFloat(latency.p50.toFixed(2)),
      p90: parseFloat(latency.p90.toFixed(2)),
      p95: parseFloat(latency.p95.toFixed(2)),
      p99: parseFloat(latency.p99.toFixed(2)),
      max: parseFloat(latency.max.toFixed(2)),
      avg: parseFloat(latency.avg.toFixed(2)),
    },
    quality: {
      apdex: apdex ? parseFloat(apdex.toFixed(3)) : null,
      errorRate: parseFloat(errorRateValue.toFixed(4)),
    },
  };
}

/**
 * 콘솔 출력용 포맷팅된 요약
 * @param {object} result - generateSummary 결과
 */
export function printSummary(result) {
  const { throughput, reservation, latency, quality } = result;

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                       부하 테스트 결과 요약                          ║');
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log(`║  시나리오: ${result.scenario.padEnd(57)}║`);
  console.log(`║  환경: ${result.env.padEnd(61)}║`);
  console.log(`║  이벤트/슬롯: ${result.eventId}/${result.slotId}`.padEnd(69) + '║');
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log('║  [처리량]                                                          ║');
  console.log(`║    총 요청: ${String(throughput.totalRequests).padEnd(56)}║`);
  console.log(`║    RPS: ${throughput.rps.toFixed(2).padEnd(60)}║`);
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log('║  [예약 결과]                                                       ║');
  console.log(`║    성공: ${String(reservation.success).padEnd(59)}║`);
  console.log(`║    실패: ${String(reservation.failed).padEnd(59)}║`);
  console.log(`║      - 정원 초과: ${String(reservation.slotFull).padEnd(50)}║`);
  console.log(`║      - 중복 예약: ${String(reservation.duplicate).padEnd(50)}║`);
  console.log(`║      - 서버 에러: ${String(reservation.serverError).padEnd(50)}║`);
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log('║  [응답 시간 (ms)]                                                  ║');
  console.log(`║    최소: ${latency.min.toFixed(0).padEnd(59)}║`);
  console.log(`║    p50 (중앙값): ${latency.p50.toFixed(0).padEnd(51)}║`);
  console.log(`║    p90: ${latency.p90.toFixed(0).padEnd(60)}║`);
  console.log(`║    p95: ${latency.p95.toFixed(0).padEnd(60)}║`);
  console.log(`║    p99: ${latency.p99.toFixed(0).padEnd(60)}║`);
  console.log(`║    최대: ${latency.max.toFixed(0).padEnd(59)}║`);
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log('║  [품질 지표]                                                       ║');
  const apdexStr = quality.apdex !== null ? quality.apdex.toFixed(3) : 'N/A';
  console.log(`║    Apdex (T=200ms): ${apdexStr.padEnd(48)}║`);
  console.log(`║    서버 에러율: ${quality.errorRate.toFixed(3)}%`.padEnd(69) + '║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

/**
 * handleSummary 핸들러
 * @param {object} data - k6 메트릭 데이터
 * @returns {object} 출력 대상 (stdout, 파일 등)
 */
export function handleSummaryReport(data) {
  const result = generateSummary(data);
  printSummary(result);

  return {
    stdout: JSON.stringify(result, null, 2),
  };
}
