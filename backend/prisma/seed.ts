import {
  PrismaClient,
  Track,
  Role,
  AuthProvider,
  ApplicationUnit,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');
  // 1. 시스템 관리자 생성
  const admin = await prisma.authAccount.upsert({
    where: {
      provider_providerId: {
        provider: AuthProvider.INTERNAL,
        providerId: 'admin',
      },
    },
    update: {},
    create: {
      provider: AuthProvider.INTERNAL,
      providerId: 'admin',
      passwordHash: 'hashed-password',
      user: {
        create: {
          name: '시스템 관리자',
          role: Role.ADMIN,
        },
      },
    },
    include: { user: true },
  });

  const adminUserId = admin.user.id;
  console.log('✓ 관리자 계정 생성:', adminUserId);

  // 2. 테스트 사용자 생성 (예약 테스트용)
  const testUser = await prisma.authAccount.upsert({
    where: {
      provider_providerId: {
        provider: AuthProvider.GITHUB,
        providerId: '12345678',
      },
    },
    update: {},
    create: {
      provider: AuthProvider.GITHUB,
      providerId: '12345678',
      user: {
        create: {
          name: '테스트 사용자',
          role: Role.USER,
        },
      },
    },
    include: { user: true },
  });

  console.log('✓ 테스트 사용자 생성:', testUser.user.id);

  // 3. 이벤트 생성
  const event1 = await prisma.event.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: '1주차: 웹 풀스택 과정 멘토링',
      description:
        'React와 Node.js를 활용한 웹 풀스택 개발 기초를 다지는 시간입니다. 멘토님과 함께 코드 리뷰 및 아키텍처 설계를 진행합니다.',
      track: Track.WEB,
      applicationUnit: ApplicationUnit.TEAM,
      creatorId: adminUserId,
      startTime: new Date('2026-01-15T14:00:00+09:00'),
      endTime: new Date('2026-01-15T18:00:00+09:00'),
      slotSchema: {
        fields: ['content', 'startTime', 'endTime', 'location'],
        description: '멘토링 세션 정보',
      },
    },
  });
  console.log('✓ 이벤트 1 생성:', event1.title);

  const event2 = await prisma.event.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      title: '1주차: Android 코틀린 심화',
      description:
        '코틀린 코루틴과 비동기 처리에 대해 심도 있게 학습합니다. 실무에서 자주 발생하는 이슈를 중심으로 다룹니다.',
      track: Track.ANDROID,
      applicationUnit: ApplicationUnit.INDIVIDUAL,
      creatorId: adminUserId,
      startTime: new Date('2026-01-22T10:00:00+09:00'),
      endTime: new Date('2026-01-22T12:00:00+09:00'),
      slotSchema: {
        fields: ['content', 'startTime', 'endTime', 'location'],
        description: '안드로이드 세션 정보',
      },
    },
  });
  console.log('✓ 이벤트 2 생성:', event2.title);

  const event3 = await prisma.event.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      title: '1주차: iOS 오토레이아웃 마스터',
      description:
        '복잡한 UI도 쉽게 구현할 수 있는 오토레이아웃 비법을 전수합니다. 다양한 해상도 대응 전략을 다룹니다.',
      track: Track.IOS,
      applicationUnit: ApplicationUnit.INDIVIDUAL,
      creatorId: adminUserId,
      startTime: new Date('2026-01-28T13:00:00+09:00'),
      endTime: new Date('2026-01-28T16:00:00+09:00'),
      slotSchema: {
        fields: ['content', 'startTime', 'endTime', 'location'],
        description: 'iOS 세션 정보',
      },
    },
  });
  console.log('✓ 이벤트 3 생성:', event3.title);

  // 4. 이벤트 슬롯 생성
  const slots = [
    {
      id: 1,
      eventId: 1,
      maxCapacity: 5,
      currentCount: 5,
      extraInfo: {
        content: 'A팀 멘토링',
        startTime: '14:00',
        endTime: '15:00',
        location: 'Zoom',
      },
    },
    {
      id: 2,
      eventId: 1,
      maxCapacity: 5,
      currentCount: 3,
      extraInfo: {
        content: 'B팀 멘토링',
        startTime: '15:00',
        endTime: '16:00',
        location: 'Zoom',
      },
    },
    {
      id: 3,
      eventId: 1,
      maxCapacity: 5,
      currentCount: 1,
      extraInfo: {
        content: 'C팀 멘토링',
        startTime: '16:00',
        endTime: '17:00',
        location: 'Zoom',
      },
    },
    {
      id: 4,
      eventId: 1,
      maxCapacity: 5,
      currentCount: 2,
      extraInfo: {
        content: 'D팀 멘토링',
        startTime: '17:00',
        endTime: '18:00',
        location: 'Zoom',
      },
    },
    {
      id: 5,
      eventId: 2,
      maxCapacity: 6,
      currentCount: 4,
      extraInfo: {
        content: '코루틴 기초',
        startTime: '10:00',
        endTime: '10:30',
        location: '강남 캠퍼스 301호',
      },
    },
    {
      id: 6,
      eventId: 2,
      maxCapacity: 6,
      currentCount: 6,
      extraInfo: {
        content: '비동기 처리 실습',
        startTime: '10:30',
        endTime: '11:00',
        location: '강남 캠퍼스 301호',
      },
    },
    {
      id: 7,
      eventId: 2,
      maxCapacity: 6,
      currentCount: 2,
      extraInfo: {
        content: 'Q&A 세션',
        startTime: '11:00',
        endTime: '12:00',
        location: '강남 캠퍼스 301호',
      },
    },
    {
      id: 8,
      eventId: 3,
      maxCapacity: 4,
      currentCount: 3,
      extraInfo: {
        content: '오토레이아웃 기초',
        startTime: '13:00',
        endTime: '14:00',
        location: 'Zoom',
      },
    },
    {
      id: 9,
      eventId: 3,
      maxCapacity: 4,
      currentCount: 4,
      extraInfo: {
        content: '스택뷰 활용',
        startTime: '14:00',
        endTime: '15:00',
        location: 'Zoom',
      },
    },
    {
      id: 10,
      eventId: 3,
      maxCapacity: 4,
      currentCount: 1,
      extraInfo: {
        content: '다양한 해상도 대응',
        startTime: '15:00',
        endTime: '16:00',
        location: 'Zoom',
      },
    },
  ];

  for (const slot of slots) {
    await prisma.eventSlot.upsert({
      where: { id: slot.id },
      update: {},
      create: slot,
    });
  }

  console.log('✓ 슬롯 데이터 생성 완료');
  console.log('🎉 Seed 완료!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed 실패:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
