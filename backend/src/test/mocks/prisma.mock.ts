/**
 * Prisma 모킹 유틸리티
 *
 * 테스트에서 PrismaService를 모킹할 때 사용합니다.
 * @golevelup/ts-jest의 createMock을 활용하여 타입 안전성을 보장합니다.
 */

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * PrismaService의 완전한 DeepMocked 인스턴스를 생성합니다.
 * 모든 모델 메서드가 자동으로 jest.fn()으로 모킹됩니다.
 */
export function createPrismaServiceMock(): DeepMocked<PrismaService> {
  return createMock<PrismaService>();
}

/**
 * 기존 호환성을 위한 수동 Prisma Mock
 * 명시적인 모델과 메서드만 모킹합니다.
 */
export const createPrismaMock = () => ({
  event: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  eventSlot: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  reservation: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  authAccount: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  template: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  camperOrganization: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  camperPreRegistration: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  eventNotification: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
});

export type PrismaMock = ReturnType<typeof createPrismaMock>;

/**
 * 트랜잭션 모킹 헬퍼
 *
 * $transaction 내부에서 사용할 mock context를 생성합니다.
 */
export const createTxMock = () => ({
  eventSlot: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  reservation: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
});

export type TxMock = ReturnType<typeof createTxMock>;

/**
 * 트랜잭션을 mock으로 래핑하는 헬퍼
 *
 * @example
 * const prismaMock = createPrismaMock();
 * const txMock = createTxMock();
 * setupTransactionMock(prismaMock, txMock);
 */
export function setupTransactionMock(
  prismaMock: PrismaMock,
  txMock: TxMock,
): void {
  prismaMock.$transaction.mockImplementation(async (callback) => {
    if (typeof callback === 'function') {
      return callback(txMock);
    }
    return Promise.all(callback);
  });
}
