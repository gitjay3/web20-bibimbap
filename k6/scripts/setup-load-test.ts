/**
 * k6 부하 테스트 환경 셋업 스크립트
 *
 * 이 스크립트는 다음을 수행합니다:
 * 1. 테스트 사용자 생성 (DB)
 * 2. JWT 토큰 생성
 * 3. 조직 멤버십 등록 (CamperOrganization)
 * 4. 캠퍼 사전등록 (CamperPreRegistration) - 트랙 검증용
 * 5. 대기열 토큰 생성 (Redis)
 * 6. 테스트 이벤트 시간 조정
 *
 * 사용법:
 *   pnpm k6:setup:small      - 200명, 개인 (경쟁 테스트)
 *   pnpm k6:setup:stress     - 5000명 (스트레스 테스트)
 *   pnpm k6:setup:spike      - 10000명 (스파이크 테스트)
 *
 * 환경변수:
 *   - USER_COUNT: 생성할 사용자 수 (기본: 200)
 *   - EVENT_ID: 테스트할 이벤트 ID (기본: 100)
 *   - ORGANIZATION_ID: 조직 ID (기본: 자동 탐지)
 *
 * K6 테스트 이벤트:
 *   - 100: 소규모 경쟁 (정원 5명, 개인)
 *   - 101: 대규모 처리량 (정원 100명, 개인)
 *   - 102: 팀 예약 (정원 10팀, 팀)
 */
import 'dotenv/config';
import { PrismaClient, Track, ApplicationUnit } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// 환경 변수
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_LOCAL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL 환경변수가 필요합니다');
}

const pool = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: pool });

const REDIS_CONTAINER = process.env.REDIS_CONTAINER || 'bookstcamp-redis';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || 'redis123';

// Docker exec를 통한 Redis 명령 실행
function redisExec(command: string): string {
  try {
    return execSync(
      `docker exec ${REDIS_CONTAINER} redis-cli -a ${REDIS_PASSWORD} ${command}`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
  } catch {
    return '';
  }
}

// Redis 파이프라인 실행 (대량 명령용)
function redisPipeline(commands: string[]): void {
  if (commands.length === 0) return;

  const BATCH_SIZE = 1000;
  for (let i = 0; i < commands.length; i += BATCH_SIZE) {
    const batch = commands.slice(i, i + BATCH_SIZE);
    const pipelineCmd = batch.map((cmd) => `redis-cli -a ${REDIS_PASSWORD} ${cmd}`).join(' && ');
    try {
      execSync(`docker exec ${REDIS_CONTAINER} sh -c '${pipelineCmd}'`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch {
      // 개별 실행 fallback
      batch.forEach((cmd) => redisExec(cmd));
    }
  }
}

const USER_COUNT = parseInt(process.env.USER_COUNT || '200');
const EVENT_ID = parseInt(process.env.EVENT_ID || '100');
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-not-for-production';
const JWT_EXPIRES_IN = '24h';
const QUEUE_TOKEN_TTL = 3600; // 1시간
const BATCH_SIZE = 100; // DB 배치 크기

const OUTPUT_DIR = path.join(__dirname, '..');
const TOKENS_FILE = path.join(OUTPUT_DIR, 'test-tokens.json');
const USERS_FILE = path.join(OUTPUT_DIR, 'test-tokens-users.json');

interface TestUser {
  id: string;
  username: string;
  token: string;
}

// 진행률 표시
function showProgress(current: number, total: number, label: string): void {
  const percent = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
  process.stdout.write(`\r  [${bar}] ${percent}% (${current}/${total}) ${label}`);
  if (current === total) console.log();
}

async function main() {
  const startTime = Date.now();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           k6 부하 테스트 환경 셋업                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // 1. 이벤트 정보 조회
  console.log(`[1/6] 이벤트 정보 조회 (EVENT_ID=${EVENT_ID})...`);
  const event = await prisma.event.findUnique({
    where: { id: EVENT_ID },
    include: { slots: true },
  });

  if (!event) {
    throw new Error(`이벤트를 찾을 수 없습니다: ${EVENT_ID}`);
  }

  const organizationId = process.env.ORGANIZATION_ID || event.organizationId;
  const track = event.track as Track;
  const isTeamEvent = event.applicationUnit === ApplicationUnit.TEAM;

  console.log(`  - 이벤트: ${event.title}`);
  console.log(`  - 트랙: ${track}`);
  console.log(`  - 신청 단위: ${isTeamEvent ? '팀' : '개인'}`);
  console.log(`  - 조직 ID: ${organizationId}`);
  console.log(`  - 슬롯: ${event.slots.map((s: { id: number; maxCapacity: number }) => `#${s.id}(정원${s.maxCapacity})`).join(', ')}`);

  // 2. 테스트 사용자 생성 (배치 처리)
  console.log(`\n[2/6] 테스트 사용자 생성 (${USER_COUNT}명)...`);
  const testUsers: TestUser[] = [];
  let createdCount = 0;
  let existingCount = 0;

  // 기존 사용자 일괄 조회
  const existingUsers = await prisma.user.findMany({
    where: {
      username: {
        startsWith: 'k6_test_user_',
      },
    },
  });
  const existingUserMap = new Map(existingUsers.map((u: { id: string; username: string; role: string }) => [u.username, u]));

  // 배치 단위로 처리
  for (let batch = 0; batch < Math.ceil(USER_COUNT / BATCH_SIZE); batch++) {
    const start = batch * BATCH_SIZE + 1;
    const end = Math.min((batch + 1) * BATCH_SIZE, USER_COUNT);
    const usersToCreate: { username: string; name: string; role: 'USER' | 'ADMIN' }[] = [];

    for (let i = start; i <= end; i++) {
      const username = `k6_test_user_${i.toString().padStart(5, '0')}`;
      const existing = existingUserMap.get(username);

      if (!existing) {
        usersToCreate.push({
          username,
          name: `Test User ${i}`,
          role: 'USER',
        });
      } else {
        const token = jwt.sign(
          { sub: existing.id, username: existing.username, role: existing.role },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );
        testUsers.push({ id: existing.id, username: existing.username, token });
        existingCount++;
      }
    }

    // 새 사용자 일괄 생성
    if (usersToCreate.length > 0) {
      await prisma.user.createMany({
        data: usersToCreate,
        skipDuplicates: true,
      });

      // 생성된 사용자 조회하여 토큰 생성
      const newUsers = await prisma.user.findMany({
        where: {
          username: { in: usersToCreate.map((u) => u.username) },
        },
      });

      for (const user of newUsers) {
        const token = jwt.sign(
          { sub: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );
        testUsers.push({ id: user.id, username: user.username, token });
        createdCount++;
      }
    }

    showProgress(end, USER_COUNT, '사용자 생성');
  }

  // 순서 정렬 (username 기준)
  testUsers.sort((a, b) => a.username.localeCompare(b.username));

  console.log(`  - 새로 생성: ${createdCount}명`);
  console.log(`  - 기존 존재: ${existingCount}명`);

  // 3. 조직 멤버십 등록 (CamperOrganization)
  console.log(`\n[3/6] 조직 멤버십 등록 (CamperOrganization)...`);
  let membershipCreated = 0;
  let membershipUpdated = 0;

  const TEAM_SIZE = 2;

  // 기존 멤버십 일괄 조회
  const existingMemberships = await prisma.camperOrganization.findMany({
    where: {
      organizationId,
      userId: { in: testUsers.map((u) => u.id) },
    },
  });
  const membershipMap = new Map(existingMemberships.map((m: { id: number; userId: string; groupNumber: number | null }) => [m.userId, m]));

  for (let batch = 0; batch < Math.ceil(testUsers.length / BATCH_SIZE); batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min((batch + 1) * BATCH_SIZE, testUsers.length);
    const toCreate: {
      userId: string;
      organizationId: string;
      camperId: string;
      groupNumber: number | null;
    }[] = [];
    const toUpdate: { id: number; groupNumber: number | null }[] = [];

    for (let i = start; i < end; i++) {
      const user = testUsers[i];
      const camperId = `K${(900 + i).toString().padStart(5, '0')}`;
      const groupNumber = isTeamEvent ? 100 + Math.floor(i / TEAM_SIZE) : null;
      const existing = membershipMap.get(user.id);

      if (!existing) {
        toCreate.push({ userId: user.id, organizationId, camperId, groupNumber });
      } else if (existing.groupNumber !== groupNumber) {
        toUpdate.push({ id: existing.id, groupNumber });
      }
    }

    if (toCreate.length > 0) {
      await prisma.camperOrganization.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      membershipCreated += toCreate.length;
    }

    for (const item of toUpdate) {
      await prisma.camperOrganization.update({
        where: { id: item.id },
        data: { groupNumber: item.groupNumber },
      });
      membershipUpdated++;
    }

    showProgress(end, testUsers.length, '멤버십 등록');
  }

  console.log(`  - 새로 등록: ${membershipCreated}명`);
  console.log(`  - 그룹 업데이트: ${membershipUpdated}명`);
  if (isTeamEvent) {
    const numTeams = Math.ceil(testUsers.length / TEAM_SIZE);
    console.log(`  - 그룹 번호: 100 ~ ${99 + numTeams} (${TEAM_SIZE}명씩 ${numTeams}팀)`);
  }

  // 4. 캠퍼 사전등록 (CamperPreRegistration)
  console.log(`\n[4/6] 캠퍼 사전등록 (트랙: ${track})...`);
  let preRegCreated = 0;

  // 기존 사전등록 일괄 조회
  const existingPreRegs = await prisma.camperPreRegistration.findMany({
    where: {
      organizationId,
      camperId: {
        startsWith: 'K',
      },
    },
  });
  const preRegMap = new Map(existingPreRegs.map((p: { id: number; camperId: string; track: Track; groupNumber: number | null }) => [p.camperId, p]));

  for (let batch = 0; batch < Math.ceil(testUsers.length / BATCH_SIZE); batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min((batch + 1) * BATCH_SIZE, testUsers.length);
    const toCreate: {
      claimedUserId: string;
      organizationId: string;
      camperId: string;
      username: string;
      name: string;
      track: Track;
      groupNumber: number | null;
      status: 'CLAIMED';
    }[] = [];

    for (let i = start; i < end; i++) {
      const user = testUsers[i];
      const camperId = `K${(900 + i).toString().padStart(5, '0')}`;
      const groupNumber = isTeamEvent ? 100 + Math.floor(i / TEAM_SIZE) : null;
      const existing = preRegMap.get(camperId);

      if (!existing) {
        toCreate.push({
          claimedUserId: user.id,
          organizationId,
          camperId,
          username: user.username,
          name: `Test User ${i + 1}`,
          track,
          groupNumber,
          status: 'CLAIMED',
        });
      } else if (existing.track !== track || existing.groupNumber !== groupNumber) {
        await prisma.camperPreRegistration.update({
          where: { id: existing.id },
          data: { track, groupNumber },
        });
      }
    }

    if (toCreate.length > 0) {
      await prisma.camperPreRegistration.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      preRegCreated += toCreate.length;
    }

    showProgress(end, testUsers.length, '사전등록');
  }

  console.log(`  - 새로 등록: ${preRegCreated}명`);

  // 5. 대기열 토큰 생성 (Redis)
  console.log(`\n[5/6] 대기열 토큰 생성 (Redis, TTL=${QUEUE_TOKEN_TTL}초)...`);

  const redisCommands: string[] = [];
  for (const user of testUsers) {
    redisCommands.push(`SET event:${EVENT_ID}:user:${user.id}:token load-test-token EX ${QUEUE_TOKEN_TTL}`);
  }
  redisPipeline(redisCommands);
  console.log(`  - ${testUsers.length}개 토큰 생성 완료`);

  // 6. 슬롯 재고 초기화 + 기존 예약 삭제
  console.log(`\n[6/6] 슬롯 초기화...`);
  const slotIds = event.slots.map((s: { id: number }) => s.id);

  const deletedReservations = await prisma.reservation.deleteMany({
    where: { slotId: { in: slotIds } },
  });
  console.log(`  - 기존 예약 ${deletedReservations.count}건 삭제`);

  for (const slot of event.slots) {
    redisExec(`SET slot:${slot.id}:stock ${slot.maxCapacity}`);
    await prisma.eventSlot.update({
      where: { id: slot.id },
      data: { currentCount: 0 },
    });
  }
  console.log(`  - ${event.slots.length}개 슬롯 재고 초기화 완료`);

  // 이벤트 시간 조정
  const now = new Date();
  const startTimeEvent = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const endTimeEvent = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await prisma.event.update({
    where: { id: EVENT_ID },
    data: { startTime: startTimeEvent, endTime: endTimeEvent },
  });

  // 토큰 파일 저장
  const tokens = testUsers.map((u) => u.token);
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
  fs.writeFileSync(USERS_FILE, JSON.stringify(testUsers, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n✅ 셋업 완료! (${elapsed}초, ${USER_COUNT}명)\n`);
}

main()
  .catch((e) => {
    console.error('\n에러:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
