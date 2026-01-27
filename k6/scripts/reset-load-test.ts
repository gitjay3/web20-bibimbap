/**
 * k6 부하 테스트 리셋 스크립트
 *
 * 빠른 리셋: 예약 삭제 + 재고 초기화 + 대기열 토큰 재생성
 * (사용자/멤버십/사전등록은 건드리지 않음)
 *
 * 사용법:
 *   pnpm k6:reset
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_LOCAL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL 환경변수가 필요합니다');
}

const pool = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: pool });

const REDIS_CONTAINER = process.env.REDIS_CONTAINER || 'bookstcamp-redis';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || 'redis123';

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
      batch.forEach((cmd) => redisExec(cmd));
    }
  }
}

// K6 테스트 이벤트 ID들 (seed.ts에서 생성)
const K6_EVENT_IDS = [100, 101, 102];
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-not-for-production';
const JWT_EXPIRES_IN = '24h';
const QUEUE_TOKEN_TTL = 3600;

const OUTPUT_DIR = path.join(__dirname, '..');
const TOKENS_FILE = path.join(OUTPUT_DIR, 'test-tokens.json');
const USERS_FILE = path.join(OUTPUT_DIR, 'test-tokens-users.json');

async function main() {
  const startTime = Date.now();
  console.log('\n⚡ k6 리셋 시작...\n');

  // 1. 모든 K6 테스트 이벤트 조회
  const events = await prisma.event.findMany({
    where: { id: { in: K6_EVENT_IDS } },
    include: { slots: true },
  });

  if (events.length === 0) {
    throw new Error('K6 테스트 이벤트를 찾을 수 없습니다');
  }

  console.log(`K6 테스트 이벤트 ${events.length}개 발견:`);
  for (const event of events) {
    console.log(`  - ${event.id}: ${event.title}`);
  }

  // 2. 모든 이벤트의 슬롯 ID 수집
  const allSlots = events.flatMap((e: { slots: { id: number; maxCapacity: number }[] }) => e.slots);
  const allSlotIds = allSlots.map((s: { id: number }) => s.id);

  // 3. 기존 예약 삭제
  const deletedReservations = await prisma.reservation.deleteMany({
    where: { slotId: { in: allSlotIds } },
  });
  console.log(`\n예약 삭제: ${deletedReservations.count}건`);

  // 4. 슬롯 재고 초기화
  for (const slot of allSlots) {
    redisExec(`SET slot:${slot.id}:stock ${slot.maxCapacity}`);
    await prisma.eventSlot.update({
      where: { id: slot.id },
      data: { currentCount: 0 },
    });
  }
  console.log(`슬롯 재고 초기화: ${allSlots.length}개`);

  // 4. 기존 토큰 파일에서 사용자 로드 및 토큰 재생성
  let userCount = 0;
  if (fs.existsSync(USERS_FILE)) {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) as { id: string; username: string }[];
    userCount = users.length;

    // 대기열 토큰 재생성
    const redisCommands: string[] = [];
    const newTokens: string[] = [];

    for (const user of users) {
      // 모든 K6 이벤트에 대해 대기열 토큰 생성
      for (const eventId of K6_EVENT_IDS) {
        redisCommands.push(`SET event:${eventId}:user:${user.id}:token load-test-token EX ${QUEUE_TOKEN_TTL}`);
      }

      // JWT 토큰도 재생성
      const token = jwt.sign(
        { sub: user.id, username: user.username, role: 'USER' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      newTokens.push(token);
    }

    redisPipeline(redisCommands);
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(newTokens, null, 2));
    console.log(`토큰 재생성: ${userCount}개`);
  } else {
    console.log('⚠️  토큰 파일 없음 - pnpm k6:setup 먼저 실행 필요');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ 리셋 완료 (${elapsed}초)\n`);
}

main()
  .catch((e) => {
    console.error('\n에러:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
