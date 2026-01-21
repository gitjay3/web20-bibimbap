import {
  PrismaClient,
  Track,
  Role,
  AuthProvider,
  ApplicationUnit,
  PreRegStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. 마스터 비밀번호 설정
  // TODO: .env로 수정
  const adminPassword = 'test-123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // 2. 시스템 관리자 생성
  const admin = await prisma.authAccount.upsert({
    where: {
      provider_providerId: {
        provider: AuthProvider.INTERNAL,
        providerId: 'admin',
      },
    },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      provider: AuthProvider.INTERNAL,
      providerId: 'admin',
      passwordHash: hashedPassword,
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

  // 3. 테스트 사용자 생성 (예약 테스트용)
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

  // 3-1. 조직(Organization) 생성
  const organization = await prisma.organization.create({
    data: {
      name: '부스트캠프 10기 웹 풀스택 멤버십',
    },
  });
  console.log('✓ 조직 생성:', organization.name);

  // 3-2. 사전 등록(PreRegistration) 데이터 생성
  // (1) 미가입 유저 (INVITED)
  await prisma.camperPreRegistration.create({
    data: {
      organizationId: organization.id,
      camperId: 'J283',
      name: '한지은',
      username: 'hanpengbutt',
      track: Track.WEB,
      status: PreRegStatus.INVITED,
    },
  });

  await prisma.camperPreRegistration.create({
    data: {
      organizationId: organization.id,
      camperId: 'J049',
      name: '김시영',
      username: 'wfs0502',
      track: Track.WEB,
      status: PreRegStatus.INVITED,
    },
  });

  await prisma.camperPreRegistration.create({
    data: {
      organizationId: organization.id,
      camperId: 'J116',
      name: '박재성',
      username: 'gitjay3',
      track: Track.WEB,
      status: PreRegStatus.INVITED,
    },
  });

  await prisma.camperPreRegistration.create({
    data: {
      organizationId: organization.id,
      camperId: 'J248',
      name: '정희재',
      username: 'RainWhales',
      track: Track.WEB,
      status: PreRegStatus.INVITED,
    },
  });

  // (2) 탈퇴/재가입 시나리오 등을 위한 가입 유저 (CLAIMED) - 시드에서는 테스트용으로 미리 연결해둘 수도 있음
  // 여기서는 로직 테스트를 위해 'testuser'를 위한 사전등록 데이터를 생성해둡니다.
  await prisma.camperPreRegistration.create({
    data: {
      organizationId: organization.id,
      camperId: 'J999',
      name: '테스트 사용자',
      username: '12345678',
      track: Track.ANDROID,
      status: PreRegStatus.CLAIMED,
      claimedUserId: testUser.user.id,
    },
  });

  // 이미 CLAIMED 상태니까 CamperOrganization도 연결해줌
  await prisma.camperOrganization.create({
    data: {
      userId: testUser.user.id,
      organizationId: organization.id,
    },
  });

  console.log('✓ 사전 등록 데이터 생성 완료');

  // 4. 이벤트 생성
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
      organizationId: organization.id,
      startTime: new Date('2026-01-01T00:00:00+09:00'),
      endTime: new Date('2026-02-28T23:59:59+09:00'),
      slotSchema: {
        content: { label: '내용', type: 'string' },
        eventDate: { label: '행사 날짜', type: 'string' },
        startTime: { label: '시작 시간', type: 'string' },
        endTime: { label: '종료 시간', type: 'string' },
        location: { label: '장소', type: 'string' },
        mentorName: { label: '멘토명', type: 'string' },
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
      organizationId: organization.id,
      startTime: new Date('2026-03-01T00:00:00+09:00'),
      endTime: new Date('2026-03-31T23:59:59+09:00'),
      slotSchema: {
        content: { label: '내용', type: 'string' },
        eventDate: { label: '행사 날짜', type: 'string' },
        startTime: { label: '시작 시간', type: 'string' },
        endTime: { label: '종료 시간', type: 'string' },
        location: { label: '장소', type: 'string' },
        mentorName: { label: '멘토명', type: 'string' },
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
      organizationId: organization.id,
      startTime: new Date('2026-04-01T00:00:00+09:00'),
      endTime: new Date('2026-04-30T23:59:59+09:00'),
      slotSchema: {
        content: { label: '내용', type: 'string' },
        eventDate: { label: '행사 날짜', type: 'string' },
        startTime: { label: '시작 시간', type: 'string' },
        endTime: { label: '종료 시간', type: 'string' },
        location: { label: '장소', type: 'string' },
        mentorName: { label: '멘토명', type: 'string' },
      },
    },
  });
  console.log('✓ 이벤트 3 생성:', event3.title);

  // 5. 이벤트 슬롯 생성
  const slots = [
    {
      id: 1,
      eventId: 1,
      maxCapacity: 5,
      currentCount: 5,
      extraInfo: {
        content: 'A팀 멘토링',
        eventDate: '2026-02-15',
        startTime: '14:00',
        endTime: '15:00',
        location: 'Zoom',
        mentorName: '크롱',
      },
    },
    {
      id: 2,
      eventId: 1,
      maxCapacity: 5,
      currentCount: 3,
      extraInfo: {
        content: 'B팀 멘토링',
        eventDate: '2026-02-15',
        startTime: '15:00',
        endTime: '16:00',
        location: 'Zoom',
        mentorName: '크롱',
      },
    },
    {
      id: 3,
      eventId: 1,
      maxCapacity: 5,
      currentCount: 1,
      extraInfo: {
        content: 'C팀 멘토링',
        eventDate: '2026-02-15',
        startTime: '16:00',
        endTime: '17:00',
        location: 'Zoom',
        mentorName: '크롱',
      },
    },
    {
      id: 4,
      eventId: 1,
      maxCapacity: 5,
      currentCount: 2,
      extraInfo: {
        content: 'D팀 멘토링',
        eventDate: '2026-02-15',
        startTime: '17:00',
        endTime: '18:00',
        location: 'Zoom',
        mentorName: '크롱',
      },
    },
    {
      id: 5,
      eventId: 2,
      maxCapacity: 6,
      currentCount: 4,
      extraInfo: {
        content: '코루틴 기초',
        eventDate: '2026-03-15',
        startTime: '10:00',
        endTime: '10:30',
        location: '강남 캠퍼스 301호',
        mentorName: '호눅스',
      },
    },
    {
      id: 6,
      eventId: 2,
      maxCapacity: 6,
      currentCount: 6,
      extraInfo: {
        content: '비동기 처리 실습',
        eventDate: '2026-03-15',
        startTime: '10:30',
        endTime: '11:00',
        location: '강남 캠퍼스 301호',
        mentorName: '호눅스',
      },
    },
    {
      id: 7,
      eventId: 2,
      maxCapacity: 6,
      currentCount: 2,
      extraInfo: {
        content: 'Q&A 세션',
        eventDate: '2026-03-15',
        startTime: '11:00',
        endTime: '12:00',
        location: '강남 캠퍼스 301호',
        mentorName: '호눅스',
      },
    },
    {
      id: 8,
      eventId: 3,
      maxCapacity: 4,
      currentCount: 3,
      extraInfo: {
        content: '오토레이아웃 기초',
        eventDate: '2026-04-15',
        startTime: '13:00',
        endTime: '14:00',
        location: 'Zoom',
        mentorName: 'JK',
      },
    },
    {
      id: 9,
      eventId: 3,
      maxCapacity: 4,
      currentCount: 4,
      extraInfo: {
        content: '스택뷰 활용',
        eventDate: '2026-04-15',
        startTime: '14:00',
        endTime: '15:00',
        location: 'Zoom',
        mentorName: 'JK',
      },
    },
    {
      id: 10,
      eventId: 3,
      maxCapacity: 4,
      currentCount: 1,
      extraInfo: {
        content: '다양한 해상도 대응',
        eventDate: '2026-04-15',
        startTime: '15:00',
        endTime: '16:00',
        location: 'Zoom',
        mentorName: 'JK',
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

  // 6. PostgreSQL ID 시퀀스 초기화
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Event"', 'id'), coalesce(max(id), 1)) FROM "Event"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"EventSlot"', 'id'), coalesce(max(id), 1)) FROM "EventSlot"`;

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
