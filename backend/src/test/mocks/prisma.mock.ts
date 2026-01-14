/**
 * Prisma 모킹 유틸리티
 *
 * 테스트에서 PrismaService를 모킹할 때 사용합니다.
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
  },
  reservation: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
});

export type TxMock = ReturnType<typeof createTxMock>;
