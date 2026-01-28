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
  // 헬퍼 함수
  const toFixed = (val, digits = 2) => parseFloat((val || 0).toFixed(digits));
  const getValues = (metric) => data.metrics[metric]?.values || {};

  // 기본 메트릭
  const totalRequests = getValues('http_reqs').count || 0;
  const rps = getValues('http_reqs').rate || 0;
  const iterations = getValues('iterations').count || 0;
  const vusMax = getValues('vus_max').max || getValues('vus').max || 0;

  // 데이터 전송량
  const dataReceived = getValues('data_received').count || 0;
  const dataSent = getValues('data_sent').count || 0;

  // 예약 결과
  const successCount = getValues('reservation_success').count || 0;
  const failedCount = getValues('reservation_failed').count || 0;
  const slotFullCount = getValues('reservation_slot_full').count || 0;
  const duplicateCount = getValues('reservation_duplicate').count || 0;
  const serverErrorCount = getValues('server_errors').count || 0;

  // 대기열 결과
  const queueEnterSuccessCount = getValues('queue_enter_success').count || 0;
  const queueEnterFailedCount = getValues('queue_enter_failed').count || 0;
  const queueTokenAcquiredCount = getValues('queue_token_acquired').count || 0;

  // 대기열 응답 시간
  const queueEnterDur = getValues('queue_enter_duration');
  const queueEnterLatency = {
    min: queueEnterDur.min || 0,
    p50: queueEnterDur.med || 0,
    p95: queueEnterDur['p(95)'] || 0,
    p99: queueEnterDur['p(99)'] || 0,
    max: queueEnterDur.max || 0,
    avg: queueEnterDur.avg || 0,
  };

  const queueStatusDur = getValues('queue_status_duration');
  const queueStatusLatency = {
    min: queueStatusDur.min || 0,
    p50: queueStatusDur.med || 0,
    p95: queueStatusDur['p(95)'] || 0,
    p99: queueStatusDur['p(99)'] || 0,
    max: queueStatusDur.max || 0,
    avg: queueStatusDur.avg || 0,
  };

  // 응답 시간 (커스텀 메트릭)
  const duration = getValues('reservation_duration');
  const latency = {
    min: duration.min || 0,
    p50: duration.med || 0,
    p90: duration['p(90)'] || 0,
    p95: duration['p(95)'] || 0,
    p99: duration['p(99)'] || 0,
    max: duration.max || 0,
    avg: duration.avg || 0,
  };

  // HTTP 응답 시간 (k6 기본 메트릭)
  const httpDuration = getValues('http_req_duration');
  const httpLatency = {
    min: httpDuration.min || 0,
    p50: httpDuration.med || 0,
    p90: httpDuration['p(90)'] || 0,
    p95: httpDuration['p(95)'] || 0,
    p99: httpDuration['p(99)'] || 0,
    max: httpDuration.max || 0,
    avg: httpDuration.avg || 0,
  };

  // HTTP 타이밍 상세
  const httpTiming = {
    blocked: toFixed(getValues('http_req_blocked').avg),
    connecting: toFixed(getValues('http_req_connecting').avg),
    tlsHandshaking: toFixed(getValues('http_req_tls_handshaking').avg),
    sending: toFixed(getValues('http_req_sending').avg),
    waiting: toFixed(getValues('http_req_waiting').avg),
    receiving: toFixed(getValues('http_req_receiving').avg),
  };

  // HTTP 실패율
  const httpFailedRate = getValues('http_req_failed').rate || 0;

  // Apdex 계산
  const satisfied = getValues('apdex_satisfied').count || 0;
  const tolerating = getValues('apdex_tolerating').count || 0;
  const frustrated = getValues('apdex_frustrated').count || 0;
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
    summary: {
      vusMax,
      iterations,
      totalRequests,
      rps: toFixed(rps),
      dataReceived: toFixed(dataReceived / 1024 / 1024, 2), // MB
      dataSent: toFixed(dataSent / 1024 / 1024, 2), // MB
    },
    reservation: {
      success: successCount,
      failed: failedCount,
      slotFull: slotFullCount,
      duplicate: duplicateCount,
      serverError: serverErrorCount,
    },
    queue: {
      enterSuccess: queueEnterSuccessCount,
      enterFailed: queueEnterFailedCount,
      tokenAcquired: queueTokenAcquiredCount,
    },
    queueEnterLatency: {
      min: toFixed(queueEnterLatency.min),
      p50: toFixed(queueEnterLatency.p50),
      p95: toFixed(queueEnterLatency.p95),
      p99: toFixed(queueEnterLatency.p99),
      max: toFixed(queueEnterLatency.max),
      avg: toFixed(queueEnterLatency.avg),
    },
    queueStatusLatency: {
      min: toFixed(queueStatusLatency.min),
      p50: toFixed(queueStatusLatency.p50),
      p95: toFixed(queueStatusLatency.p95),
      p99: toFixed(queueStatusLatency.p99),
      max: toFixed(queueStatusLatency.max),
      avg: toFixed(queueStatusLatency.avg),
    },
    latency: {
      min: toFixed(latency.min),
      p50: toFixed(latency.p50),
      p90: toFixed(latency.p90),
      p95: toFixed(latency.p95),
      p99: toFixed(latency.p99),
      max: toFixed(latency.max),
      avg: toFixed(latency.avg),
    },
    httpLatency: {
      min: toFixed(httpLatency.min),
      p50: toFixed(httpLatency.p50),
      p90: toFixed(httpLatency.p90),
      p95: toFixed(httpLatency.p95),
      p99: toFixed(httpLatency.p99),
      max: toFixed(httpLatency.max),
      avg: toFixed(httpLatency.avg),
    },
    httpTiming,
    quality: {
      apdex: apdex ? toFixed(apdex, 3) : null,
      errorRate: toFixed(errorRateValue, 4),
      httpFailedRate: toFixed(httpFailedRate * 100, 4),
    },
  };
}

/**
 * 콘솔 출력용 포맷팅된 요약
 * @param {object} result - generateSummary 결과
 */
export function printSummary(result) {
  const { summary, reservation, latency, httpTiming, quality, queue } = result;

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                       부하 테스트 결과 요약                          ║');
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log(`║  시나리오: ${result.scenario.padEnd(57)}║`);
  console.log(`║  환경: ${result.env.padEnd(61)}║`);
  console.log(`║  이벤트/슬롯: ${result.eventId}/${result.slotId}`.padEnd(69) + '║');
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log('║  [테스트 요약]                                                     ║');
  console.log(`║    최대 VU: ${String(summary.vusMax).padEnd(56)}║`);
  console.log(`║    총 반복: ${String(summary.iterations).padEnd(56)}║`);
  console.log(`║    총 요청: ${String(summary.totalRequests).padEnd(56)}║`);
  console.log(`║    RPS: ${summary.rps.toFixed(2).padEnd(60)}║`);
  console.log(`║    수신: ${summary.dataReceived.toFixed(2)} MB`.padEnd(68) + '║');
  console.log(`║    송신: ${summary.dataSent.toFixed(2)} MB`.padEnd(68) + '║');
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log('║  [예약 결과]                                                       ║');
  console.log(`║    성공: ${String(reservation.success).padEnd(59)}║`);
  console.log(`║    실패: ${String(reservation.failed).padEnd(59)}║`);
  console.log(`║      - 정원 초과: ${String(reservation.slotFull).padEnd(50)}║`);
  console.log(`║      - 중복 예약: ${String(reservation.duplicate).padEnd(50)}║`);
  console.log(`║      - 서버 에러: ${String(reservation.serverError).padEnd(50)}║`);
  // 대기열 결과 (대기열 테스트에서만 출력)
  if (queue && (queue.enterSuccess > 0 || queue.enterFailed > 0)) {
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║  [대기열 결과]                                                     ║');
    console.log(`║    진입 성공: ${String(queue.enterSuccess).padEnd(54)}║`);
    console.log(`║    진입 실패: ${String(queue.enterFailed).padEnd(54)}║`);
    console.log(`║    토큰 획득: ${String(queue.tokenAcquired).padEnd(54)}║`);
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║  [응답 시간 - 대기열 진입 API (ms)]                               ║');
    console.log(`║    p50: ${result.queueEnterLatency.p50.toFixed(0).padEnd(60)}║`);
    console.log(`║    p95: ${result.queueEnterLatency.p95.toFixed(0).padEnd(60)}║`);
    console.log(`║    p99: ${result.queueEnterLatency.p99.toFixed(0).padEnd(60)}║`);
    console.log(`║    최소/최대: ${result.queueEnterLatency.min.toFixed(0)} / ${result.queueEnterLatency.max.toFixed(0)}`.padEnd(68) + '║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║  [응답 시간 - 대기열 상태 조회 API (ms)]                           ║');
    console.log(`║    p50: ${result.queueStatusLatency.p50.toFixed(0).padEnd(60)}║`);
    console.log(`║    p95: ${result.queueStatusLatency.p95.toFixed(0).padEnd(60)}║`);
    console.log(`║    p99: ${result.queueStatusLatency.p99.toFixed(0).padEnd(60)}║`);
    console.log(`║    최소/최대: ${result.queueStatusLatency.min.toFixed(0)} / ${result.queueStatusLatency.max.toFixed(0)}`.padEnd(68) + '║');
  }
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log('║  [응답 시간 - 예약 API (ms)]                                       ║');
  console.log(`║    p50: ${latency.p50.toFixed(0).padEnd(60)}║`);
  console.log(`║    p90: ${latency.p90.toFixed(0).padEnd(60)}║`);
  console.log(`║    p95: ${latency.p95.toFixed(0).padEnd(60)}║`);
  console.log(`║    p99: ${latency.p99.toFixed(0).padEnd(60)}║`);
  console.log(`║    최소/최대: ${latency.min.toFixed(0)} / ${latency.max.toFixed(0)}`.padEnd(68) + '║');
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log('║  [HTTP 타이밍 상세 (ms, 평균)]                                     ║');
  console.log(`║    대기: ${httpTiming.blocked.toFixed(2).padEnd(59)}║`);
  console.log(`║    연결: ${httpTiming.connecting.toFixed(2).padEnd(59)}║`);
  console.log(`║    전송: ${httpTiming.sending.toFixed(2).padEnd(59)}║`);
  console.log(`║    서버 처리 (TTFB): ${httpTiming.waiting.toFixed(2).padEnd(47)}║`);
  console.log(`║    수신: ${httpTiming.receiving.toFixed(2).padEnd(59)}║`);
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log('║  [품질 지표]                                                       ║');
  const apdexStr = quality.apdex !== null ? quality.apdex.toFixed(3) : 'N/A';
  console.log(`║    Apdex (T=200ms): ${apdexStr.padEnd(48)}║`);
  console.log(`║    서버 에러율: ${quality.errorRate.toFixed(3)}%`.padEnd(69) + '║');
  console.log(`║    HTTP 실패율: ${quality.httpFailedRate.toFixed(3)}%`.padEnd(69) + '║');
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

  const output = {
    stdout: JSON.stringify(result, null, 2),
  };

  // TEST_ID가 있으면 JSON 파일로 저장
  const testId = __ENV.TEST_ID;
  if (testId) {
    output[`k6/results/${testId}.json`] = JSON.stringify(result, null, 2);
    console.log(`\n📁 결과 저장: k6/results/${testId}.json\n`);
  }

  return output;
}
