import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';

@Injectable()
export class SlackService {
  private client: WebClient;
  private readonly logger = new Logger(SlackService.name);

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('SLACK_BOT_TOKEN');
    if (!token) {
      this.logger.warn(
        'SLACK_BOT_TOKEN is not defined. Slack notifications will be disabled.',
      );
    }
    this.client = new WebClient(token);
  }

  async scheduleReminder(
    channel: string,
    postAt: number,
    text: string,
  ): Promise<string | undefined> {
    try {
      if (!this.client.token) {
        this.logger.warn('Slack client not initialized with token');
        return undefined;
      }

      const result = await this.client.chat.scheduleMessage({
        channel,
        post_at: postAt,
        text,
      });

      if (result.ok) {
        this.logger.log(`Scheduled Slack message to ${channel} at ${postAt}`);
        return result.scheduled_message_id;
      } else {
        this.logger.error(`Failed to schedule Slack message: ${result.error}`);
        return undefined;
      }
    } catch (error) {
      this.logger.error(`Error scheduling Slack message: ${error}`);
      return undefined;
    }
  }
  async deleteScheduledMessage(
    channel: string,
    scheduledMessageId: string,
  ): Promise<boolean> {
    try {
      if (!this.client.token) {
        this.logger.warn('Slack client not initialized with token');
        return false;
      }

      const result = await this.client.chat.deleteScheduledMessage({
        channel,
        scheduled_message_id: scheduledMessageId,
      });

      if (result.ok) {
        this.logger.log(
          `Deleted scheduled Slack message: ${scheduledMessageId} in ${channel}`,
        );
        return true;
      } else {
        this.logger.error(
          `Failed to delete scheduled Slack message: ${result.error}`,
        );
        return false;
      }
    } catch (error) {
      this.logger.error(`Error deleting scheduled Slack message: ${error}`);
      return false;
    }
  }
  async getDmChannelId(userId: string): Promise<string | undefined> {
    try {
      if (!this.client.token) {
        this.logger.warn('Slack client not initialized with token');
        return undefined;
      }
      const result = await this.client.conversations.open({
        users: userId,
      });

      if (result.ok && result.channel?.id) {
        return result.channel.id;
      } else {
        this.logger.error(
          `Failed to open DM channel for user ${userId}: ${result.error}`,
        );
        return undefined;
      }
    } catch (error) {
      this.logger.error(`Error opening DM channel: ${error}`);
      return undefined;
    }
  }
}
