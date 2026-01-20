import { instanceToPlain } from 'class-transformer';
import { Prisma } from '@prisma/client';

export function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  // class instance -> plain object
  const plain = instanceToPlain(value);

  return plain as Prisma.InputJsonValue;
}
