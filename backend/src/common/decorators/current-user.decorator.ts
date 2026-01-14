import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User as PrismaUser } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): PrismaUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: PrismaUser }>();

    return request.user;
  },
);
