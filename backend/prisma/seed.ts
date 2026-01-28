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
import { ReservationStatus } from '@prisma/client';

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
          username: 'admin',
          name: '시스템 관리자',
          avatarUrl: 'https://i.pravatar.cc/150?u=admin',
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
          username: 'testuser',
          name: '테스트 사용자',
          avatarUrl: 'https://i.pravatar.cc/150?u=testuser',
          role: Role.USER,
        },
      },
    },
    include: { user: true },
  });

  console.log('✓ 테스트 사용자 생성:', testUser.user.id);

  // 3-0. 추가 테스트 사용자들 (명단 표시 확인용 - 실제 가입 계정과 겹치지 않게 변경)
  const extraUsers = await Promise.all(
    [
      {
        username: 'testuser1',
        name: '김코딩',
        avatar: 'https://i.pravatar.cc/150?u=testuser1',
      },
      {
        username: 'testuser2',
        name: '박직원',
        avatar: 'https://i.pravatar.cc/150?u=testuser2',
      },
      {
        username: 'testuser3',
        name: '이캠퍼',
        avatar: 'https://i.pravatar.cc/150?u=testuser3',
      },
      {
        username: 'testuser4',
        name: '최멘토',
        avatar: 'https://i.pravatar.cc/150?u=testuser4',
      },
    ].map((u) =>
      prisma.authAccount.create({
        data: {
          provider: AuthProvider.GITHUB,
          providerId: `mock_${u.username}`,
          user: {
            create: {
              username: u.username,
              name: u.name,
              avatarUrl: u.avatar,
              role: Role.USER,
            },
          },
        },
        include: { user: true },
      }),
    ),
  );
  console.log('✓ 추가 테스트 사용자 4명 생성 완료');

  // 3-1. 조직(Organization) 생성
  const organization = await prisma.organization.create({
    data: {
      name: '부스트캠프 10기 웹 풀스택 멤버십',
    },
  });
  console.log('✓ 조직 생성:', organization.name);

  // 3-2. 사전 등록(PreRegistration) 데이터 생성
  // (1) 미가입 유저 (INVITED) - 그룹 번호 포함
  // 그룹 1: hanpengbutt, wfs0502
  // 그룹 2: gitjay3, RainWhales
  await prisma.camperPreRegistration.create({
    data: {
      organizationId: organization.id,
      camperId: 'J283',
      name: '한지은',
      username: 'hanpengbutt',
      track: Track.WEB,
      groupNumber: 1,
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
      groupNumber: 1,
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
      groupNumber: 2,
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
      groupNumber: 2,
      status: PreRegStatus.INVITED,
    },
  });

  // (2) 탈퇴/재가입 시나리오 등을 위한 가입 유저 (CLAIMED) - 시드에서는 테스트용으로 미리 연결해둘 수도 있음
  // 여기서는 로직 테스트를 위해 'testuser'를 위한 사전등록 데이터를 생성해둡니다.
  // 그룹 3: testuser (팀장), testuser1, testuser2
  // 그룹 4: testuser3, testuser4
  await prisma.camperPreRegistration.create({
    data: {
      organizationId: organization.id,
      camperId: 'J999',
      name: '테스트 사용자',
      username: 'testuser',
      track: Track.WEB,
      groupNumber: 3,
      status: PreRegStatus.CLAIMED,
      claimedUserId: testUser.user.id,
    },
  });

  // 이미 CLAIMED 상태니까 CamperOrganization도 연결해줌
  await prisma.camperOrganization.create({
    data: {
      userId: testUser.user.id,
      organizationId: organization.id,
      camperId: 'J999',
      groupNumber: 3,
    },
  });

  // 추가 테스트 유저들도 CamperOrganization에 그룹과 함께 등록
  // 그룹 3: testuser1, testuser2
  // 그룹 4: testuser3, testuser4
  const extraUserGroups = [3, 3, 4, 4]; // testuser1, testuser2는 그룹3 / testuser3, testuser4는 그룹4
  for (let i = 0; i < extraUsers.length; i++) {
    await prisma.camperOrganization.create({
      data: {
        userId: extraUsers[i].user.id,
        organizationId: organization.id,
        camperId: `J00${i + 1}`,
        groupNumber: extraUserGroups[i],
      },
    });
  }

  console.log('✓ 사전 등록 데이터 생성 완료');

  // 공통 schema
  const defaultSlotSchema = {
    fields: [
      { id: 'f1', name: '내용', type: 'text' },
      { id: 'f2', name: '날짜', type: 'text' },
      { id: 'f3', name: '시작 시간', type: 'text' },
      { id: 'f4', name: '종료 시간', type: 'text' },
      { id: 'f5', name: '장소', type: 'text' },
      { id: 'f6', name: '멘토명', type: 'text' },
    ],
  };

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
      slotSchema: defaultSlotSchema,
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
      slotSchema: defaultSlotSchema,
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
      slotSchema: defaultSlotSchema,
    },
  });
  console.log('✓ 이벤트 3 생성:', event3.title);

  // 4-4. 공통 이벤트 (COMMON)
  const event4 = await prisma.event.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      title: '전체 공통: 취업 특강',
      description:
        '모든 트랙 캠퍼들을 위한 취업 준비 특강입니다. 이력서 작성법, 면접 팁 등을 다룹니다.',
      track: Track.COMMON,
      applicationUnit: ApplicationUnit.INDIVIDUAL,
      creatorId: adminUserId,
      organizationId: organization.id,
      startTime: new Date('2026-03-01T00:00:00+09:00'),
      endTime: new Date('2026-03-31T23:59:59+09:00'),
      slotSchema: defaultSlotSchema,
    },
  });
  console.log('✓ 이벤트 4 생성:', event4.title);

  // 4-5. 알림 테스트용 이벤트 (Web, Individual, 10분 뒤 오픈)
  const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000); // 현재 시간 + 10분
  const oneHourLater = new Date(tenMinutesLater.getTime() + 60 * 60 * 1000); // 1시간 뒤 종료

  const event5 = await prisma.event.upsert({
    where: { id: 5 },
    update: {
        startTime: tenMinutesLater,
        endTime: oneHourLater,
    },
    create: {
      id: 5,
      title: '[TEST] 알림 테스트용 이벤트 (10분 뒤 오픈)',
      description: '알림 기능 테스트를 위한 이벤트입니다. 예약 오픈 10분 전입니다.',
      track: Track.WEB,
      applicationUnit: ApplicationUnit.INDIVIDUAL,
      creatorId: adminUserId,
      organizationId: organization.id,
      startTime: tenMinutesLater,
      endTime: oneHourLater,
      slotSchema: defaultSlotSchema,
    },
  });
  console.log('✓ 이벤트 5 (알림 테스트) 생성, 시작 시간:', tenMinutesLater.toLocaleString());

  // ========================================
  // K6 부하 테스트용 이벤트 (ID 100~)
  // ========================================

  // K6 시나리오 1: 소규모 정원 경쟁 (정원 5명, 동시 50명 요청)
  const k6Event1 = await prisma.event.upsert({
    where: { id: 100 },
    update: {},
    create: {
      id: 100,
      title: '[K6] 소규모 경쟁 테스트',
      description: '정원 5명 슬롯에 50명이 동시 요청하는 시나리오',
      track: Track.COMMON, // 모든 트랙 허용
      applicationUnit: ApplicationUnit.INDIVIDUAL,
      creatorId: adminUserId,
      organizationId: organization.id,
      startTime: new Date('2025-01-01T00:00:00+09:00'),
      endTime: new Date('2030-12-31T23:59:59+09:00'),
      slotSchema: defaultSlotSchema,
    },
  });
  console.log('✓ K6 이벤트 100 생성:', k6Event1.title);

  // K6 시나리오 2: 대규모 처리량 테스트 (정원 100명)
  const k6Event2 = await prisma.event.upsert({
    where: { id: 101 },
    update: {},
    create: {
      id: 101,
      title: '[K6] 대규모 처리량 테스트',
      description: '정원 100명 슬롯에 대한 처리량 테스트',
      track: Track.COMMON,
      applicationUnit: ApplicationUnit.INDIVIDUAL,
      creatorId: adminUserId,
      organizationId: organization.id,
      startTime: new Date('2025-01-01T00:00:00+09:00'),
      endTime: new Date('2030-12-31T23:59:59+09:00'),
      slotSchema: defaultSlotSchema,
    },
  });
  console.log('✓ K6 이벤트 101 생성:', k6Event2.title);

  // K6 시나리오 3: 팀 단위 예약 테스트
  const k6Event3 = await prisma.event.upsert({
    where: { id: 102 },
    update: {},
    create: {
      id: 102,
      title: '[K6] 팀 예약 테스트',
      description: '팀 단위 예약 동시성 테스트',
      track: Track.COMMON,
      applicationUnit: ApplicationUnit.TEAM,
      creatorId: adminUserId,
      organizationId: organization.id,
      startTime: new Date('2025-01-01T00:00:00+09:00'),
      endTime: new Date('2030-12-31T23:59:59+09:00'),
      slotSchema: defaultSlotSchema,
    },
  });
  console.log('✓ K6 이벤트 102 생성:', k6Event3.title);

  // 5. 이벤트 슬롯 생성
  // 팀 이벤트(슬롯 1~4): 그룹 3, 4가 예약 → currentCount: 2
  // 개인 이벤트(슬롯 5~10): 개인별 예약
  const slots = [
    {
      id: 1,
      eventId: 1,
      maxCapacity: 5,
      currentCount: 2, // 2팀 예약 (그룹 3, 4)
      extraInfo: {
        f1: 'A팀 멘토링',
        f2: '2026-02-15',
        f3: '14:00',
        f4: '15:00',
        f5: 'Zoom',
        f6: '크롱',
      },
    },
    {
      id: 2,
      eventId: 1,
      maxCapacity: 5,
      currentCount: 2, // 2팀 예약 (그룹 3, 4)
      extraInfo: {
        f1: 'B팀 멘토링',
        f2: '2026-02-15',
        f3: '15:00',
        f4: '16:00',
        f5: 'Zoom',
        f6: '크롱',
      },
    },
    {
      id: 3,
      eventId: 1,
      maxCapacity: 5,
      currentCount: 1, // 1팀만 예약 (그룹 3만)
      extraInfo: {
        f1: 'C팀 멘토링',
        f2: '2026-02-15',
        f3: '16:00',
        f4: '17:00',
        f5: 'Zoom',
        f6: '크롱',
      },
    },
    {
      id: 4,
      eventId: 1,
      maxCapacity: 5,
      currentCount: 2, // 2팀 예약 (그룹 3, 4)
      extraInfo: {
        f1: 'D팀 멘토링',
        f2: '2026-02-15',
        f3: '17:00',
        f4: '18:00',
        f5: 'Zoom',
        f6: '크롱',
      },
    },
    {
      id: 5,
      eventId: 2,
      maxCapacity: 6,
      currentCount: 4,
      extraInfo: {
        f1: '코루틴 기초',
        f2: '2026-03-15',
        f3: '10:00',
        f4: '10:30',
        f5: '강남 캠퍼스 301호',
        f6: '호눅스',
      },
    },
    {
      id: 6,
      eventId: 2,
      maxCapacity: 6,
      currentCount: 6,
      extraInfo: {
        f1: '비동기 처리 실습',
        f2: '2026-03-15',
        f3: '10:30',
        f4: '11:00',
        f5: '강남 캠퍼스 301호',
        f6: '호눅스',
      },
    },
    {
      id: 7,
      eventId: 2,
      maxCapacity: 6,
      currentCount: 2,
      extraInfo: {
        f1: 'Q&A 세션',
        f2: '2026-03-15',
        f3: '11:00',
        f4: '12:00',
        f5: '강남 캠퍼스 301호',
        f6: '호눅스',
      },
    },
    {
      id: 8,
      eventId: 3,
      maxCapacity: 4,
      currentCount: 3,
      extraInfo: {
        f1: '오토레이아웃 기초',
        f2: '2026-04-15',
        f3: '13:00',
        f4: '14:00',
        f5: 'Zoom',
        f6: 'JK',
      },
    },
    {
      id: 9,
      eventId: 3,
      maxCapacity: 4,
      currentCount: 4,
      extraInfo: {
        f1: '스택뷰 활용',
        f2: '2026-04-15',
        f3: '14:00',
        f4: '15:00',
        f5: 'Zoom',
        f6: 'JK',
      },
    },
    {
      id: 10,
      eventId: 3,
      maxCapacity: 4,
      currentCount: 1,
      extraInfo: {
        f1: '다양한 해상도 대응',
        f2: '2026-04-15',
        f3: '15:00',
        f4: '16:00',
        f5: 'Zoom',
        f6: 'JK',
      },
    },
    // event4 (COMMON) 슬롯
    {
      id: 11,
      eventId: 4,
      maxCapacity: 30,
      currentCount: 5,
      extraInfo: {
        f1: '이력서 작성법',
        f2: '2026-03-20',
        f3: '14:00',
        f4: '15:30',
        f5: '대강당',
        f6: '취업 멘토',
      },
    },
    {
      id: 12,
      eventId: 4,
      maxCapacity: 30,
      currentCount: 10,
      extraInfo: {
        f1: '면접 준비 팁',
        f2: '2026-03-20',
        f3: '16:00',
        f4: '17:30',
        f5: '대강당',
        f6: '취업 멘토',
      },
    },
    // event5 (알림 테스트) 슬롯
    {
      id: 13,
      eventId: 5,
      maxCapacity: 10,
      currentCount: 0,
      extraInfo: {
        f1: '알림 테스트 슬롯',
        f2: '오늘',
        f3: '지금+10분',
        f4: '지금+70분',
        f5: '제페토',
        f6: '테스터',
      },
    },
    // ========================================
    // K6 테스트용 슬롯 (ID 100~)
    // ========================================
    // K6 이벤트 100: 소규모 경쟁 (정원 5명)
    {
      id: 100,
      eventId: 100,
      maxCapacity: 5,
      currentCount: 0,
      extraInfo: {
        f1: '소규모 경쟁 슬롯',
        f2: '2026-06-01',
        f3: '10:00',
        f4: '11:00',
        f5: '테스트룸',
        f6: 'K6봇',
      },
    },
    // K6 이벤트 101: 대규모 처리량 (정원 100명)
    {
      id: 101,
      eventId: 101,
      maxCapacity: 100,
      currentCount: 0,
      extraInfo: {
        f1: '대규모 처리량 슬롯',
        f2: '2026-06-01',
        f3: '10:00',
        f4: '11:00',
        f5: '테스트룸',
        f6: 'K6봇',
      },
    },
    // K6 이벤트 102: 팀 예약 (정원 10팀)
    {
      id: 102,
      eventId: 102,
      maxCapacity: 10,
      currentCount: 0,
      extraInfo: {
        f1: '팀 예약 슬롯',
        f2: '2026-06-01',
        f3: '10:00',
        f4: '11:00',
        f5: '테스트룸',
        f6: 'K6봇',
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

  // 7. 가짜 예약 데이터 생성 (명단 확인용)
  console.log('🌱 가짜 예약 데이터 생성 중...');
  const reserversPool = [testUser.user.id, ...extraUsers.map((a) => a.user.id)];

  // 이벤트 1 (팀 이벤트)의 슬롯들 (id: 1~4)은 팀 단위 예약
  // 이벤트 2, 3 (개인 이벤트)의 슬롯들 (id: 5~10)은 개인 단위 예약
  const teamEventSlotIds = [1, 2, 3, 4];

  for (const slot of slots) {
    if (slot.currentCount > 0) {
      const isTeamSlot = teamEventSlotIds.includes(slot.id);

      if (isTeamSlot) {
        // 팀 이벤트: 그룹 단위로 예약 (한 그룹 = 1 capacity)
        // 그룹 3과 그룹 4가 예약
        const teamGroups = [3, 4];
        const reserveCount = Math.min(slot.currentCount, teamGroups.length);
        for (let i = 0; i < reserveCount; i++) {
          const groupNumber = teamGroups[i];
          // 해당 그룹의 대표자(첫 번째 멤버)로 예약 생성
          // 그룹 3: testUser, 그룹 4: testuser3 (extraUsers[2])
          const representativeUserId =
            groupNumber === 3 ? testUser.user.id : extraUsers[2].user.id;
          await prisma.reservation.create({
            data: {
              userId: representativeUserId,
              slotId: slot.id,
              groupNumber,
              status: ReservationStatus.CONFIRMED,
            },
          });
        }
        console.log(
          `✓ 슬롯 ${slot.id}번 (팀 이벤트)에 대한 ${reserveCount}개 그룹 예약 생성 완료`,
        );
      } else {
        // 개인 이벤트: 개인 단위로 예약
        for (let i = 0; i < slot.currentCount; i++) {
          const userId = reserversPool[i % reserversPool.length];
          await prisma.reservation.create({
            data: {
              userId,
              slotId: slot.id,
              status: ReservationStatus.CONFIRMED,
            },
          });
        }
        console.log(
          `✓ 슬롯 ${slot.id}번 (개인 이벤트)에 대한 ${slot.currentCount}건의 예약 생성 완료`,
        );
      }
    }
  }

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
