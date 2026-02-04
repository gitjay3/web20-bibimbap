import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { PUBLIC_ROUTES } from '../constants/routes.constant';
import { JwtUser } from 'src/auth/types/jwt-user.type';

interface RequestWithUser extends Request {
  user?: JwtUser;
}

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Rate Limit 추적 키 결정
   * - 인증된 유저: 유저 ID 기반 (IP 우회 방지)
   * - 미인증 요청: IP 기반 (기본 동작)
   */
  protected getTracker(req: RequestWithUser): Promise<string> {
    if (req.user?.id) {
      return Promise.resolve(`user:${req.user.id}`);
    }
    return Promise.resolve(req.ip ?? 'unknown');
  }

  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Prometheus 메트릭 스크래핑은 Rate Limiting 제외
    if (request.path === PUBLIC_ROUTES.METRICS) {
      return Promise.resolve(true);
    }

    return super.shouldSkip(context);
  }
}
