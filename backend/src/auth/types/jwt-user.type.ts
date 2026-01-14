import { Role } from '@prisma/client';

export type JwtUser = {
  id: string;
  role: Role;
};
