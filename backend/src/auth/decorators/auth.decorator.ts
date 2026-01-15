import { applyDecorators, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from './roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

export function Auth(...roles: Role[]) {
  return applyDecorators(Roles(...roles), UseGuards(RolesGuard));
}
