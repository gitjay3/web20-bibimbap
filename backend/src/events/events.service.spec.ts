import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/mocks/prisma.mock';
import { ApplicationUnit, Track } from '@prisma/client';

describe('EventsService', () => {
  let service: EventsService;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: prismaMock },
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
        { id: 1, title: 'Event 1', track: Track.WEB },
        { id: 2, title: 'Event 2', track: Track.ANDROID },
      ];

      prismaMock.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAll();

      expect(result).toEqual(mockEvents);
      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { startTime: 'asc' },
        select: expect.objectContaining({
          id: true,
          title: true,
          track: true,
        }),
      });
    });

    it('track이 제공되면 해당 track의 이벤트만 반환한다', async () => {
      const mockEvents = [{ id: 1, title: 'Web Event', track: Track.WEB }];

      prismaMock.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAll('WEB');

      expect(result).toEqual(mockEvents);
      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        where: { track: Track.WEB },
        orderBy: { startTime: 'asc' },
        select: expect.any(Object),
      });
    });

    it('track이 COMMON이면 모든 이벤트를 반환한다', async () => {
      const mockEvents = [
        { id: 1, title: 'Event 1', track: Track.WEB },
        { id: 2, title: 'Event 2', track: Track.ANDROID },
      ];

      prismaMock.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAll('COMMON');

      expect(result).toEqual(mockEvents);
      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        where: undefined,
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
        where: { track: Track.WEB },
        orderBy: { startTime: 'asc' },
        select: expect.any(Object),
      });
    });

    it('track 앞뒤 공백을 제거한다', async () => {
      prismaMock.event.findMany.mockResolvedValue([]);

      await service.findAll('  android  ');
      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        where: { track: Track.ANDROID },
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
        slots: [{ id: 1, maxCapacity: 10 }],
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOne(1);

      expect(result).toEqual(mockEvent);
      expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { slots: true },
      });
    });

    it('이벤트가 존재하지 않으면 NotFoundException을 던진다', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        '존재하지 않는 이벤트입니다.',
      );
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
        slotSchema: {},
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
