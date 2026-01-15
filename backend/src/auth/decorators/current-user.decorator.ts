import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from 'src/auth/types/jwt-user.type';

export const CurrentUser = createParamDecorator(
  (key: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = req.user;
    return key ? user?.[key] : user;
  },
);
