import { NotFoundException } from '@nestjs/common';

/**
 * 엔티티가 없으면 NotFoundException을 던짐 (TypeScript assertion function)
 * @param entity - 검증할 엔티티
 * @param message - 예외 메시지
 */
export function throwIfNotFound<T>(
  entity: T | null | undefined,
  message: string,
): asserts entity is T {
  if (entity === null || entity === undefined) {
    throw new NotFoundException(message);
  }
}
