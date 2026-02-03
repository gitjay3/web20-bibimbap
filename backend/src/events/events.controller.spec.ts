import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventSlotsService } from '../event-slots/event-slots.service';
import { Track, ApplicationUnit } from '@prisma/client';

const createEventsServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const createEventSlotsServiceMock = () => ({
  findByEventWithAvailability: jest.fn(),
});

describe('EventsController', () => {
  let controller: EventsController;
  let eventsServiceMock: ReturnType<typeof createEventsServiceMock>;
  let eventSlotsServiceMock: ReturnType<typeof createEventSlotsServiceMock>;

  beforeEach(async () => {
    eventsServiceMock = createEventsServiceMock();
    eventSlotsServiceMock = createEventSlotsServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: eventsServiceMock },
        { provide: EventSlotsService, useValue: eventSlotsServiceMock },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('이벤트를 생성한다', async () => {
      const createDto = {
        title: '테스트 이벤트',
        description: '테스트 이벤트 설명',
        track: Track.WEB,
        organizationId: 'org-123',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T18:00:00Z'),
        applicationUnit: ApplicationUnit.INDIVIDUAL,
        slotSchema: { fields: [] },
        slots: [],
      };
      const mockEvent = { id: 1, ...createDto };
      eventsServiceMock.create.mockResolvedValue(mockEvent);

      const result = await controller.create(createDto, 'user-123');

      expect(result).toEqual(mockEvent);
      expect(eventsServiceMock.create).toHaveBeenCalledWith(
        createDto,
        'user-123',
      );
    });
  });

  describe('findAll', () => {
    it('모든 이벤트를 조회한다', async () => {
      const mockEvents = [
        { id: 1, title: 'Event 1' },
        { id: 2, title: 'Event 2' },
      ];
      eventsServiceMock.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findAll();

      expect(result).toEqual(mockEvents);
    });

    it('트랙으로 필터링한다', async () => {
      const mockEvents = [{ id: 1, title: 'Web Event', track: Track.WEB }];
      eventsServiceMock.findAll.mockResolvedValue(mockEvents);

      await controller.findAll('WEB');

      expect(eventsServiceMock.findAll).toHaveBeenCalledWith(
        'WEB',
        undefined,
        undefined,
      );
    });

    it('조직 ID로 필터링한다', async () => {
      const mockEvents = [{ id: 1, title: 'Org Event' }];
      eventsServiceMock.findAll.mockResolvedValue(mockEvents);

      await controller.findAll(undefined, undefined, 'org-123');

      expect(eventsServiceMock.findAll).toHaveBeenCalledWith(
        undefined,
        undefined,
        'org-123',
      );
    });
  });

  describe('findOne', () => {
    it('이벤트 상세를 조회한다', async () => {
      const mockEvent = { id: 1, title: 'Test Event', canReserveByTrack: true };
      eventsServiceMock.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne(1, 'user-123');

      expect(result).toEqual(mockEvent);
      expect(eventsServiceMock.findOne).toHaveBeenCalledWith(1, 'user-123');
    });

    it('userId 없이도 이벤트 상세를 조회한다', async () => {
      const mockEvent = { id: 1, title: 'Test Event', canReserveByTrack: true };
      eventsServiceMock.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne(1, undefined);

      expect(result).toEqual(mockEvent);
      expect(eventsServiceMock.findOne).toHaveBeenCalledWith(1, undefined);
    });
  });

  describe('getSlotsWithAvailability', () => {
    it('이벤트 슬롯과 가용성을 조회한다', async () => {
      const mockSlots = {
        slots: [
          { id: 1, maxCapacity: 10, currentCount: 2 },
          { id: 2, maxCapacity: 20, currentCount: 5 },
        ],
      };
      eventSlotsServiceMock.findByEventWithAvailability.mockResolvedValue(
        mockSlots,
      );

      const result = await controller.getSlotsWithAvailability(1);

      expect(result).toEqual(mockSlots);
      expect(
        eventSlotsServiceMock.findByEventWithAvailability,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('updateEvent', () => {
    it('이벤트를 수정한다', async () => {
      const updateDto = { title: '수정된 이벤트' };
      const mockEvent = { id: 1, ...updateDto };
      eventsServiceMock.update.mockResolvedValue(mockEvent);

      const result = await controller.updateEvent(1, updateDto);

      expect(result).toEqual(mockEvent);
      expect(eventsServiceMock.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('deleteEvent', () => {
    it('이벤트를 삭제한다', async () => {
      eventsServiceMock.delete.mockResolvedValue({ deleted: true });

      const result = await controller.deleteEvent(1);

      expect(result).toEqual({ deleted: true });
      expect(eventsServiceMock.delete).toHaveBeenCalledWith(1);
    });
  });
});
