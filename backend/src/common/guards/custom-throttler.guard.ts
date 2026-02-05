import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { PUBLIC_ROUTES } from '../constants/routes.constant';
import { JwtUser } from 'src/auth/types/jwt-user.type';
import {
  THROTTLE_KEY_TYPE,
  ThrottleKeyType,
} from '../decorators/throttle.decorator';

interface RequestWithUser extends Request {
  user?: JwtUser;
  body: { slotId?: number };
}

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    private readonly configService: ConfigService,
    ...args: ConstructorParameters<typeof ThrottlerGuard>
  ) {
    super(...args);
  }

  /**
   * Rate Limit 키 생성
   * - 메타데이터의 keyType에 따라 동적으로 키 생성
   * - eventId, slotId 등 리소스 ID를 포함하여 다른 리소스는 영향받지 않도록 함
   */
  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    throttlerName: string,
  ): string {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const tracker = this.getTrackerWithContext(request, context);

    return `${this.generatePrefix(context)}:${tracker}:${suffix}:${throttlerName}`;
  }

  private generatePrefix(context: ExecutionContext): string {
    const classKey = context.getClass().name;
    const methodKey = context.getHandler().name;
    return `${classKey}-${methodKey}`;
  }

  /**
   * 컨텍스트 기반 Tracker 키 생성
   */
  private getTrackerWithContext(
    req: RequestWithUser,
    context: ExecutionContext,
  ): string {
    const keyType = this.reflector.getAllAndOverride<ThrottleKeyType>(
      THROTTLE_KEY_TYPE,
      [context.getHandler(), context.getClass()],
    );

    const userId = req.user?.id;
    const ip = req.ip ?? 'unknown';

    // IP 기반 (로그인 등 미인증 엔드포인트)
    if (keyType === 'ip') {
      return `ip:${ip}`;
    }

    // 미인증 사용자는 IP 기반
    if (!userId) {
      return `ip:${ip}`;
    }

    const rawEventId =
      req.params?.eventId ?? req.params?.id ?? req.query?.eventId;
    const eventId = typeof rawEventId === 'string' ? rawEventId : '';

    const slotId = req.body?.slotId;

    switch (keyType) {
      case 'user:event':
        return eventId ? `user:${userId}:event:${eventId}` : `user:${userId}`;

      case 'user:slot':
        return slotId
          ? `user:${userId}:slot:${String(slotId)}`
          : `user:${userId}`;

      case 'user':
      default:
        return `user:${userId}`;
    }
  }

  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    // THROTTLE_SKIP=true면 모든 요청 통과 (k6 부하 테스트용)
    if (this.configService.get('THROTTLE_SKIP') === 'true') {
      return Promise.resolve(true);
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Prometheus 메트릭 스크래핑은 Rate Limiting 제외
    if (request.path === PUBLIC_ROUTES.METRICS) {
      return Promise.resolve(true);
    }

    return super.shouldSkip(context);
  }
}
