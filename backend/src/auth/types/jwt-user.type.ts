import { Role } from '@prisma/client';

export type JwtUser = {
  id: string;
  name: string;
  role: Role;
  organizations: {
    organization: {
      id: string;
      name: string;
    };
  }[];
};
