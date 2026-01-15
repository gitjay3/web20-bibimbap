/**
 * 테스트용 이벤트 생성 스크립트
 *
 * 사용법:
 * 1. 브라우저에서 GitHub OAuth 로그인 (ADMIN 권한 필요)
 * 2. 개발자 도구 > Application > Cookies에서 access_token 복사
 * 3. 아래 TOKEN 값을 복사한 토큰으로 교체
 * 4. 실행: npx ts-node scripts/create-test-event.ts
 */

const TOKEN = 'yourtoken'; // 브라우저에서 복사한 토큰
const BASE_URL = 'http://localhost:80/api';

async function createTestEvent() {
  const now = new Date();
  const startTime = new Date(now.getTime() - 1000 * 60 * 60); // 1시간 전 (이미 시작됨)
  const endTime = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 24시간 후

  const eventData = {
    title: '동시성 테스트 이벤트',
    description: '동시성 제어 테스트를 위한 이벤트입니다.',
    track: 'COMMON',
    applicationUnit: 'INDIVIDUAL',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    slotSchema: {
      type: 'test',
      fields: ['time'],
    },
    slots: [
      {
        maxCapacity: 5, // 5명만 예약 가능 (동시성 테스트용)
        extraInfo: {
          time: '14:00-15:00',
          location: '회의실 A',
        },
      },
    ],
  };

  try {
    const response = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${TOKEN}`,
      },
      body: JSON.stringify(eventData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('이벤트 생성 성공!');
      console.log('');
      console.log('생성된 이벤트:');
      console.log(`  ID: ${data.id}`);
      console.log(`  제목: ${data.title}`);
      console.log('');
      console.log('생성된 슬롯:');
      data.slots?.forEach((slot: { id: number; maxCapacity: number }) => {
        console.log(`  슬롯 ID: ${slot.id} (정원: ${slot.maxCapacity}명)`);
      });
      console.log('');
      console.log('이 슬롯 ID를 test-concurrency.ts의 SLOT_ID에 입력하세요.');
    } else {
      console.error('이벤트 생성 실패:', data);
    }
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

createTestEvent();
