import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PUBLIC_ROUTES } from '../../common/constants/routes.constant';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Prometheus 메트릭 스크래핑은 인증 제외
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path === PUBLIC_ROUTES.METRICS) {
      return true;
    }

    return super.canActivate(context);
  }
}
