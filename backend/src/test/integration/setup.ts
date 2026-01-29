import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

export interface TestContainers {
  postgres: StartedPostgreSqlContainer;
  redis: StartedTestContainer;
  prisma: PrismaClient;
  redisClient: Redis;
}

let containers: TestContainers | null = null;

export async function setupTestContainers(): Promise<TestContainers> {
  if (containers) return containers;

  // PostgreSQL 컨테이너 시작
  const postgres = await new PostgreSqlContainer('postgres:14-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  // Redis 컨테이너 시작
  const redis = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  // 환경 변수 설정
  const databaseUrl = postgres.getConnectionUri();
  process.env.DATABASE_URL = databaseUrl;
  process.env.REDIS_HOST = redis.getHost();
  process.env.REDIS_PORT = redis.getMappedPort(6379).toString();

  // Prisma 마이그레이션 실행
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  // Prisma 클라이언트 생성 (환경변수로 URL 전달)
  const prisma = new PrismaClient();
  await prisma.$connect();

  // Redis 클라이언트 생성
  const redisClient = new Redis({
    host: redis.getHost(),
    port: redis.getMappedPort(6379),
  });

  containers = { postgres, redis, prisma, redisClient };
  return containers;
}

export async function teardownTestContainers(): Promise<void> {
  if (!containers) return;

  await containers.prisma.$disconnect();
  containers.redisClient.disconnect();
  await containers.postgres.stop();
  await containers.redis.stop();

  containers = null;
}

export async function cleanupDatabase(prisma: PrismaClient): Promise<void> {
  // 테스트 데이터 정리 (외래 키 순서 고려)
  await prisma.reservation.deleteMany();
  await prisma.eventSlot.deleteMany();
  await prisma.event.deleteMany();
  await prisma.camperOrganization.deleteMany();
  await prisma.camperPreRegistration.deleteMany();
  await prisma.authAccount.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

export async function cleanupRedis(redisClient: Redis): Promise<void> {
  await redisClient.flushall();
}
