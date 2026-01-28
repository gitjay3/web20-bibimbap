import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { createPrismaMock } from '../test/mocks/prisma.mock';
import { ApplicationUnit, Track } from '@prisma/client';

const createRedisMock = () => ({
  initStock: jest.fn().mockResolvedValue(undefined),
  decrementStock: jest.fn().mockResolvedValue(true),
  incrementStock: jest.fn().mockResolvedValue(undefined),
});

describe('EventsService', () => {
  let service: EventsService;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let redisMock: ReturnType<typeof createRedisMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    redisMock = createRedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('track 필터 없이 모든 이벤트를 반환한다', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Event 1',
          track: Track.WEB,
          organization: { slackBotToken: 'token' },
        },
        {
          id: 2,
          title: 'Event 2',
          track: Track.ANDROID,
          organization: { slackBotToken: null },
        },
      ];

      prismaMock.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAll();

      expect(result).toEqual([
        { ...mockEvents[0], isSlackEnabled: true, organization: undefined },
        { ...mockEvents[1], isSlackEnabled: false, organization: undefined },
      ]);
      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        where: { AND: [{}, {}] },
        orderBy: { startTime: 'asc' },
        select: expect.objectContaining({
          id: true,
          title: true,
          track: true,
        }),
      });
    });

    it('track이 제공되면 해당 track의 이벤트만 반환한다', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Web Event',
          track: Track.WEB,
          organization: { slackBotToken: 'token' },
        },
      ];

      prismaMock.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAll('WEB');

      expect(result).toEqual([
        { ...mockEvents[0], isSlackEnabled: true, organization: undefined },
      ]);
      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        where: { AND: [{ track: Track.WEB }, {}] },
        orderBy: { startTime: 'asc' },
        select: expect.any(Object),
      });
    });

    it('track이 COMMON이면 모든 이벤트를 반환한다', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Event 1',
          track: Track.WEB,
          organization: { slackBotToken: 'token' },
        },
        {
          id: 2,
          title: 'Event 2',
          track: Track.ANDROID,
          organization: { slackBotToken: null },
        },
      ];

      prismaMock.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAll('COMMON');

      expect(result).toEqual([
        { ...mockEvents[0], isSlackEnabled: true, organization: undefined },
        { ...mockEvents[1], isSlackEnabled: false, organization: undefined },
      ]);
      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        where: { AND: [{}, {}] },
        orderBy: { startTime: 'asc' },
        select: expect.any(Object),
      });
    });

    it('유효하지 않은 track이면 BadRequestException을 던진다', async () => {
      await expect(service.findAll('INVALID_TRACK')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findAll('INVALID_TRACK')).rejects.toThrow(
        '유효하지 않은 track 값입니다.',
      );
    });

    it('대소문자 구분 없이 track을 처리한다', async () => {
      prismaMock.event.findMany.mockResolvedValue([]);

      await service.findAll('web');
      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        where: { AND: [{ track: Track.WEB }, {}] },
        orderBy: { startTime: 'asc' },
        select: expect.any(Object),
      });
    });

    it('track 앞뒤 공백을 제거한다', async () => {
      prismaMock.event.findMany.mockResolvedValue([]);

      await service.findAll('  android  ');
      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        where: { AND: [{ track: Track.ANDROID }, {}] },
        orderBy: { startTime: 'asc' },
        select: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('이벤트가 존재하면 슬롯과 함께 반환한다', async () => {
      const mockEvent = {
        id: 1,
        title: 'Test Event',
        organizationId: 'org-1',
        organization: { slackBotToken: 'token' },
        slots: [{ id: 1, maxCapacity: 10, reservations: [] }],
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOne(1);

      expect(result).toEqual({
        id: 1,
        title: 'Test Event',
        organizationId: 'org-1',
        organization: { slackBotToken: 'token' },
        slots: [{ id: 1, maxCapacity: 10, reservations: [] }],
        canReserveByTrack: true,
        isSlackEnabled: true,
      });
      expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          organization: {
            select: {
              slackBotToken: true,
            },
          },
          slots: {
            orderBy: { id: 'asc' },
            include: {
              reservations: {
                where: { status: 'CONFIRMED' },
                select: {
                  user: {
                    select: {
                      name: true,
                      username: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it('이벤트가 존재하지 않으면 NotFoundException을 던진다', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        '존재하지 않는 이벤트입니다.',
      );
    });

    it('사용자 트랙과 이벤트 트랙이 일치하면 canReserveByTrack이 true이다', async () => {
      const mockEvent = {
        id: 1,
        title: 'WEB Event',
        track: Track.WEB,
        organizationId: 'org-1',
        organization: { slackBotToken: 'token' },
        slots: [],
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.camperPreRegistration.findFirst.mockResolvedValue({
        track: Track.WEB,
      });

      const result = await service.findOne(1, 'user-123');

      expect(result.canReserveByTrack).toBe(true);
      expect(result.isSlackEnabled).toBe(true);
      expect(prismaMock.camperPreRegistration.findFirst).toHaveBeenCalledWith({
        where: {
          claimedUserId: 'user-123',
          organizationId: 'org-1',
        },
        select: { track: true },
      });
    });

    it('사용자 트랙과 이벤트 트랙이 불일치하면 canReserveByTrack이 false이다', async () => {
      const mockEvent = {
        id: 1,
        title: 'ANDROID Event',
        track: Track.ANDROID,
        organizationId: 'org-1',
        organization: { slackBotToken: 'token' },
        slots: [],
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.camperPreRegistration.findFirst.mockResolvedValue({
        track: Track.WEB,
      });

      const result = await service.findOne(1, 'user-123');

      expect(result.canReserveByTrack).toBe(false);
    });

    it('COMMON 이벤트는 트랙 체크 없이 canReserveByTrack이 true이다', async () => {
      const mockEvent = {
        id: 1,
        title: 'Common Event',
        track: Track.COMMON,
        organizationId: 'org-1',
        organization: { slackBotToken: 'token' },
        slots: [],
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOne(1, 'user-123');

      expect(result.canReserveByTrack).toBe(true);
      expect(result.isSlackEnabled).toBe(true);
      expect(prismaMock.camperPreRegistration.findFirst).not.toHaveBeenCalled();
    });

    it('조직에 등록되지 않은 사용자는 canReserveByTrack이 false이다', async () => {
      const mockEvent = {
        id: 1,
        title: 'WEB Event',
        track: Track.WEB,
        organizationId: 'org-1',
        organization: { slackBotToken: 'token' },
        slots: [],
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.camperPreRegistration.findFirst.mockResolvedValue(null);

      const result = await service.findOne(1, 'unregistered-user');

      expect(result.canReserveByTrack).toBe(false);
    });
  });

  describe('create', () => {
    const mockAdminUserId = 'admin-user-uuid';

    it('슬롯과 함께 이벤트를 생성한다', async () => {
      const createDto = {
        title: 'New Event',
        description: 'Event description',
        track: Track.WEB,
        applicationUnit: ApplicationUnit.INDIVIDUAL,
        startTime: new Date(),
        endTime: new Date(),
        slotSchema: { fields: [] },
        organizationId: 'org-uuid',
        slots: [{ maxCapacity: 10, extraInfo: {} }],
      };

      const mockCreatedEvent = {
        id: 1,
        ...createDto,
        creatorId: mockAdminUserId,
        slots: [{ id: 1, maxCapacity: 10, extraInfo: {} }],
      };

      prismaMock.event.create.mockResolvedValue(mockCreatedEvent);

      const result = await service.create(createDto, mockAdminUserId);

      expect(result).toEqual(mockCreatedEvent);
      expect(prismaMock.event.create).toHaveBeenCalledWith({
        data: {
          title: createDto.title,
          description: createDto.description,
          track: createDto.track,
          applicationUnit: createDto.applicationUnit,
          startTime: createDto.startTime,
          endTime: createDto.endTime,
          slotSchema: createDto.slotSchema,
          creatorId: mockAdminUserId,
          organizationId: createDto.organizationId,
          slots: {
            create: createDto.slots.map((slot) => ({
              maxCapacity: slot.maxCapacity,
              extraInfo: slot.extraInfo,
            })),
          },
        },
        include: { slots: true },
      });
    });
  });
});
