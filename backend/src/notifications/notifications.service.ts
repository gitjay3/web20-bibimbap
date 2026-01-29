import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SlackService } from '../slack/slack.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slackService: SlackService,
    private readonly configService: ConfigService,
  ) {}

  async getNotification(userId: string, eventId: number) {
    return this.prisma.eventNotification.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      select: {
        notificationTime: true,
      },
    });
  }

  async setNotification(
    userId: string,
    eventId: number,
    dto: CreateNotificationDto,
  ) {
    const { notificationTime } = dto;

    // 1. 이벤트 및 사용자 정보(Slack ID) 조회
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: true,
      },
    });

    if (!event) throw new NotFoundException('이벤트를 찾을 수 없습니다.');

    // 2. 예약 가능 상태 확인 (예정 상태)
    const now = new Date();
    if (event.startTime <= now) {
      throw new BadRequestException('이미 시작된 이벤트입니다.');
    }

    // 3. 시간 유효성 검사 (현재 시간 < 시작 시간 - 알림 시간)
    const alertTime = new Date(
      event.startTime.getTime() - notificationTime * 60 * 1000,
    );
    if (alertTime <= now) {
      throw new BadRequestException(
        '알림 설정 시간이 현재 시간보다 과거입니다.',
      );
    }

    const camperOrg = await this.prisma.camperOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: event.organizationId,
        },
      },
      select: { slackMemberId: true },
    });

    if (!camperOrg?.slackMemberId) {
      throw new BadRequestException(
        'Slack 사용자 ID가 없습니다. 마이페이지에서 등록해 주세요.',
      );
    }

    // [New] Validating Slack ID and getting DM Channel ID
    const dmChannelId = await this.slackService.getDmChannelId(
      camperOrg.slackMemberId,
    );
    if (!dmChannelId) {
      throw new BadRequestException(
        '유효하지 않은 Slack 사용자 ID입니다. 마이페이지에서 올바르게 등록되었는지 확인해 주세요.',
      );
    }

    // 4. 기존 알림 조회
    const existing = await this.prisma.eventNotification.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });

    // 5. 기존 Slack 예약 삭제 (있다면)
    if (existing?.scheduledMessageId) {
      await this.slackService.deleteScheduledMessage(
        dmChannelId, // Use resolved DM Channel ID
        existing.scheduledMessageId,
      );
    }

    // 6. 새로운 Slack 메시지 예약
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const reservationUrl = `${frontendUrl}/orgs/${event.organizationId}/events/${event.id}`;

    const message = `[알림] <${reservationUrl}|'${event.title}'> 예약이 ${notificationTime}분 뒤에 시작됩니다! ⏳`;
    const scheduledMessageId = await this.slackService.scheduleReminder(
      dmChannelId, // Use resolved DM Channel ID
      Math.floor(alertTime.getTime() / 1000),
      message,
    );

    if (!scheduledMessageId) {
      throw new BadRequestException('Slack 메시지 예약에 실패했습니다.');
    }

    // 7. DB 업데이트 (Upsert)
    return this.prisma.eventNotification.upsert({
      where: {
        userId_eventId: { userId, eventId },
      },
      update: {
        notificationTime,
        scheduledMessageId,
      },
      create: {
        userId,
        eventId,
        notificationTime,
        scheduledMessageId,
      },
    });
  }

  async deleteNotification(userId: string, eventId: number) {
    // 1. 기존 알림 조회
    const notification = await this.prisma.eventNotification.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
      include: {
        event: true,
      },
    });

    if (!notification) return { success: true }; // 이미 없음

    // 2. Slack 예약 취소
    if (notification.scheduledMessageId) {
      const camperOrg = await this.prisma.camperOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: notification.event.organizationId,
          },
        },
        select: { slackMemberId: true },
      });

      if (camperOrg?.slackMemberId) {
        // [New] Resolve DM Channel ID for deletion too
        const dmChannelId = await this.slackService.getDmChannelId(
          camperOrg.slackMemberId,
        );
        if (dmChannelId) {
          await this.slackService.deleteScheduledMessage(
            dmChannelId,
            notification.scheduledMessageId,
          );
        }
      }
    }

    // 3. DB 삭제
    await this.prisma.eventNotification.delete({
      where: {
        userId_eventId: { userId, eventId },
      },
    });

    return { success: true };
  }
}
