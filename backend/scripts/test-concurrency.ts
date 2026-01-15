/**
 * 동시성 제어 테스트 스크립트
 *
 * 사용법:
 * 1. 브라우저에서 GitHub OAuth 로그인
 * 2. 개발자 도구 > Application > Cookies에서 access_token 복사
 * 3. 아래 TOKEN 값을 복사한 토큰으로 교체
 * 4. SLOT_ID를 테스트할 슬롯 ID로 교체
 * 5. 실행: npx ts-node scripts/test-concurrency.ts
 */

const TOKEN = 'yourtoken';
const SLOT_ID = 3; // 테스트할 슬롯 ID
const CONCURRENT_REQUESTS = 10; // 동시 요청 수
const BASE_URL = 'http://localhost:80/api';

interface ReservationResponse {
  status: string;
  message: string;
  jobId?: string;
  reservation?: {
    id: number;
    slotId: number;
    status: string;
  };
}

async function makeReservation(requestId: number): Promise<{
  requestId: number;
  success: boolean;
  data?: ReservationResponse;
  error?: string;
}> {
  try {
    const response = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${TOKEN}`,
      },
      body: JSON.stringify({ slotId: SLOT_ID }),
    });

    const data = await response.json();

    return {
      requestId,
      success: response.ok,
      data,
    };
  } catch (error) {
    return {
      requestId,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runConcurrencyTest() {
  console.log('='.repeat(60));
  console.log('동시성 제어 테스트 시작');
  console.log('='.repeat(60));
  console.log(`슬롯 ID: ${SLOT_ID}`);
  console.log(`동시 요청 수: ${CONCURRENT_REQUESTS}`);
  console.log('');

  // 동시에 요청 전송
  const startTime = Date.now();
  const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
    makeReservation(i + 1),
  );

  const results = await Promise.all(promises);
  const endTime = Date.now();

  // 결과 분석
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  console.log('');
  console.log('='.repeat(60));
  console.log('테스트 결과');
  console.log('='.repeat(60));
  console.log(`총 요청: ${CONCURRENT_REQUESTS}`);
  console.log(`성공: ${successCount}`);
  console.log(`실패: ${failCount}`);
  console.log(`소요 시간: ${endTime - startTime}ms`);
  console.log('');

  // 상세 결과
  console.log('상세 결과:');
  results.forEach((result) => {
    const status = result.success ? '✓' : '✗';
    const message = result.data?.message || result.error || 'Unknown';
    console.log(`  [${status}] 요청 #${result.requestId}: ${message}`);
  });

  // 중복 예약 확인
  const queuedCount = results.filter((r) => r.data?.status === 'queued').length;
  const duplicateCount = results.filter((r) =>
    r.data?.message?.includes('이미'),
  ).length;
  const capacityFullCount = results.filter((r) =>
    r.data?.message?.includes('마감'),
  ).length;

  console.log('');
  console.log('분석:');
  console.log(`  - 큐에 등록됨: ${queuedCount}`);
  console.log(`  - 중복 예약 차단: ${duplicateCount}`);
  console.log(`  - 정원 마감: ${capacityFullCount}`);
}

runConcurrencyTest().catch(console.error);
