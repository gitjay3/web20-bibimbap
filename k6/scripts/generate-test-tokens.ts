/**
 * 테스트용 JWT 토큰 생성 스크립트
 *
 * 사용법:
 *   cd backend
 *   npx tsx ../k6/scripts/generate-test-tokens.ts
 *
 * 환경변수:
 *   - USER_COUNT: 생성할 사용자 수 (기본: 100)
 *   - OUTPUT_FILE: 출력 파일 경로 (기본: ../k6/test-tokens.json)
 *   - DATABASE_URL: 데이터베이스 연결 문자열
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_LOCAL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL 환경변수가 필요합니다');
}

const pool = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: pool });

const USER_COUNT = parseInt(process.env.USER_COUNT || '100');
const OUTPUT_FILE = process.env.OUTPUT_FILE || path.join(__dirname, '../test-tokens.json');
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
const JWT_EXPIRES_IN = '24h';

interface TestUser {
  id: string;
  username: string;
  token: string;
}

async function main() {
  console.log(`\n테스트 토큰 생성 시작 (${USER_COUNT}명)\n`);

  const testUsers: TestUser[] = [];

  // 기존 테스트 사용자 조회 또는 생성
  for (let i = 1; i <= USER_COUNT; i++) {
    const username = `k6_test_user_${i.toString().padStart(3, '0')}`;

    // 기존 사용자 찾기 또는 생성
    let user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username,
          name: `Test User ${i}`,
          role: 'USER',
        },
      });
      console.log(`  생성: ${username}`);
    } else {
      console.log(`  존재: ${username}`);
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    testUsers.push({
      id: user.id,
      username: user.username,
      token,
    });
  }

  // 토큰만 추출하여 JSON 파일로 저장
  const tokens = testUsers.map((u) => u.token);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tokens, null, 2));
  console.log(`\n토큰 파일 저장: ${OUTPUT_FILE}`);
  console.log(`총 ${tokens.length}개 토큰 생성 완료\n`);

  // 사용자 정보도 별도 저장 (디버깅용)
  const usersFile = OUTPUT_FILE.replace('.json', '-users.json');
  fs.writeFileSync(usersFile, JSON.stringify(testUsers, null, 2));
  console.log(`사용자 정보 저장: ${usersFile}\n`);
}

main()
  .catch((e) => {
    console.error('에러:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
