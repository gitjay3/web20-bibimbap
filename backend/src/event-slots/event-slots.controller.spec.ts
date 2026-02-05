import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventSlotsController } from './event-slots.controller';
import { EventSlotsService } from './event-slots.service';

const createEventSlotsServiceMock = () => ({
  getAvailabilityByEvent: jest.fn(),
  getAvailability: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(),
});

describe('EventSlotsController', () => {
  let controller: EventSlotsController;
  let serviceMock: ReturnType<typeof createEventSlotsServiceMock>;

  beforeEach(async () => {
    serviceMock = createEventSlotsServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventSlotsController],
      providers: [{ provide: EventSlotsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<EventSlotsController>(EventSlotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAvailability', () => {
    it('eventId로 슬롯 가용성을 조회한다', async () => {
      const mockAvailability = [
        { slotId: 1, maxCapacity: 10, currentCount: 2, remaining: 8 },
      ];
      serviceMock.getAvailabilityByEvent.mockResolvedValue(mockAvailability);

      const result = await controller.getAvailability(1);

      expect(result).toEqual(mockAvailability);
      expect(serviceMock.getAvailabilityByEvent).toHaveBeenCalledWith(1);
    });

    it('slotIds로 슬롯 가용성을 조회한다', async () => {
      const mockAvailability = [
        { slotId: 1, maxCapacity: 10, currentCount: 2, remaining: 8 },
        { slotId: 2, maxCapacity: 20, currentCount: 5, remaining: 15 },
      ];
      serviceMock.getAvailability.mockResolvedValue(mockAvailability);

      // Pipe가 문자열을 숫자 배열로 변환한 후의 값을 전달
      const result = await controller.getAvailability(undefined, [1, 2]);

      expect(result).toEqual(mockAvailability);
      expect(serviceMock.getAvailability).toHaveBeenCalledWith([1, 2]);
    });

    it('eventId와 slotIds 둘 다 없으면 예외를 던진다', async () => {
      await expect(controller.getAvailability()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateSlot', () => {
    it('슬롯을 수정한다', async () => {
      const updateDto = { maxCapacity: 15 };
      const mockSlot = { id: 1, maxCapacity: 15 };
      serviceMock.update.mockResolvedValue(mockSlot);

      const result = await controller.updateSlot(1, updateDto);

      expect(result).toEqual(mockSlot);
      expect(serviceMock.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('deleteSlot', () => {
    it('슬롯을 삭제한다', async () => {
      serviceMock.delete.mockResolvedValue({ deleted: true });

      const result = await controller.deleteSlot(1);

      expect(result).toEqual({ deleted: true });
      expect(serviceMock.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('createSlot', () => {
    it('슬롯을 생성한다', async () => {
      const createDto = {
        eventId: 1,
        maxCapacity: 10,
        extraInfo: { startTime: '14:00' },
      };
      const mockSlot = { id: 1, ...createDto, currentCount: 0 };
      serviceMock.create.mockResolvedValue(mockSlot);

      const result = await controller.createSlot(createDto);

      expect(result).toEqual(mockSlot);
      expect(serviceMock.create).toHaveBeenCalledWith(createDto);
    });
  });
});
