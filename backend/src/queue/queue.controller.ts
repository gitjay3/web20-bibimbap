import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { randomUUID } from 'crypto';

@Controller('queue')
@UseGuards(JwtAuthGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  // 대기열 진입
  @Post(':eventId/enter')
  async enterQueue(
    @Param('eventId', ParseIntPipe) eventId: number,
    @CurrentUser('id') userId: string,
  ) {
    const sessionId = randomUUID;
    const result = await this.queueService.enterQueue(
      eventId,
      userId,
      sessionId(),
    );

    return {
      success: true,
      data: {
        position: result.position,
        isNew: result.isNew,
        sessionId,
      },
    };
  }

  // 대기열 상태 조회
  @Get(':eventId/status')
  async getQueueStatus(
    @Param('eventId', ParseIntPipe) eventId: number,
    @CurrentUser('id') userId: string,
  ) {
    const status = await this.queueService.getQueueStatus(eventId, userId);

    return {
      success: true,
      data: {
        position: status.position,
        totalWaiting: status.totalWaiting,
        hasToken: status.hasToken,
        inQueue: status.position !== null,
        tokenExpiresAt: status.tokenExpiresAt ?? null,
      },
    };
  }
}
