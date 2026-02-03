import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { PUBLIC_ROUTES } from '../constants/routes.constant';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Prometheus 메트릭 스크래핑은 Rate Limiting 제외
    if (request.path === PUBLIC_ROUTES.METRICS) {
      return Promise.resolve(true);
    }

    return super.shouldSkip(context);
  }
}
