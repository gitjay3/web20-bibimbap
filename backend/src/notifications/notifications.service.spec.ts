import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SlackService } from '../slack/slack.service';
import { createPrismaMock } from '../test/mocks/prisma.mock';
import { BadRequestException } from '@nestjs/common';

const createSlackServiceMock = () => ({
  scheduleReminder: jest.fn(),
  deleteScheduledMessage: jest.fn(),
  getDmChannelId: jest.fn(),
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let slackMock: ReturnType<typeof createSlackServiceMock>;

  const userId = 'user-123';
  const eventId = 1;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    slackMock = createSlackServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SlackService, useValue: slackMock },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setNotification', () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 120); // 2 hours later
    const event = {
      id: eventId,
      startTime: futureDate,
      title: 'Test Event',
      organizationId: 'org-1',
    };
    const camperOrg = { slackMemberId: 'U123456' };

    it('should schedule a notification if valid', async () => {
      prismaMock.event.findUnique.mockResolvedValue(event as any);
      prismaMock.camperOrganization.findUnique.mockResolvedValue(
        camperOrg as any,
      );
      slackMock.getDmChannelId.mockResolvedValue('D123456'); // Mock DM Channel ID
      prismaMock.eventNotification.findUnique.mockResolvedValue(null);
      slackMock.scheduleReminder.mockResolvedValue('msg-id-123');
      prismaMock.eventNotification.upsert.mockResolvedValue({} as any);

      await service.setNotification(userId, eventId, { notificationTime: 30 });

      expect(slackMock.getDmChannelId).toHaveBeenCalledWith('U123456');
      expect(slackMock.scheduleReminder).toHaveBeenCalled();
      expect(prismaMock.eventNotification.upsert).toHaveBeenCalled();
    });

    it('should delete existing scheduled message when updating', async () => {
      prismaMock.event.findUnique.mockResolvedValue(event as any);
      prismaMock.camperOrganization.findUnique.mockResolvedValue(
        camperOrg as any,
      );
      slackMock.getDmChannelId.mockResolvedValue('D123456'); // Mock DM Channel ID
      prismaMock.eventNotification.findUnique.mockResolvedValue({
        scheduledMessageId: 'old-msg-id',
      } as any);
      slackMock.scheduleReminder.mockResolvedValue('new-msg-id');
      prismaMock.eventNotification.upsert.mockResolvedValue({} as any);

      await service.setNotification(userId, eventId, { notificationTime: 10 });

      expect(slackMock.deleteScheduledMessage).toHaveBeenCalledWith(
        'D123456', // Expect DM Channel ID
        'old-msg-id',
      );
      expect(slackMock.scheduleReminder).toHaveBeenCalled();
    });

    it('should throw BadRequestException if alert time is in the past', async () => {
      const nearFuture = new Date();
      nearFuture.setMinutes(nearFuture.getMinutes() + 5); // 5 mins later
      prismaMock.event.findUnique.mockResolvedValue({
        ...event,
        startTime: nearFuture,
      } as any);

      // 10 mins before start -> 5 mins in the past
      await expect(
        service.setNotification(userId, eventId, { notificationTime: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if DM channel cannot be resolved', async () => {
      prismaMock.event.findUnique.mockResolvedValue(event as any);
      prismaMock.camperOrganization.findUnique.mockResolvedValue(
        camperOrg as any,
      );
      slackMock.getDmChannelId.mockResolvedValue(undefined); // Mock resolution failure

      await expect(
        service.setNotification(userId, eventId, { notificationTime: 30 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteNotification', () => {
    it('should delete scheduled message and db record', async () => {
      prismaMock.eventNotification.findUnique.mockResolvedValue({
        scheduledMessageId: 'msg-id-123',
        event: { organizationId: 'org-1' },
      } as any);
      prismaMock.camperOrganization.findUnique.mockResolvedValue({
        slackMemberId: 'U123456',
      } as any);
      slackMock.getDmChannelId.mockResolvedValue('D123456'); // Mock DM Channel ID

      await service.deleteNotification(userId, eventId);

      expect(slackMock.deleteScheduledMessage).toHaveBeenCalledWith(
        'D123456',
        'msg-id-123',
      );
      expect(prismaMock.eventNotification.delete).toHaveBeenCalled();
    });
  });
});
