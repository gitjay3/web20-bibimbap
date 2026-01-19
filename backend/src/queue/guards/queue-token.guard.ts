import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { QueueService } from '../queue.service';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    id: string;
  };
  body: {
    eventId?: number;
  };
  params: {
    eventId?: string;
  };
}
@Injectable()
export class QueueTokenGuard implements CanActivate {
  constructor(private readonly queueService: QueueService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.id;
    const eventId = request.body?.eventId ?? request.params?.eventId;

    if (!userId || !eventId) {
      throw new ForbiddenException('유효하지 않은 요청입니다.');
    }

    // 토큰 존재 여부 확인
    const hasToken = await this.queueService.hasValidToken(
      Number(eventId),
      userId,
    );

    if (!hasToken) {
      throw new ForbiddenException(
        '예약 권한이 없습니다. 대기열을 통해 토큰을 발급받아주세요.',
      );
    }

    return true;
  }
}
