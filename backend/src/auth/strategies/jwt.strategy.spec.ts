import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { createPrismaMock } from '../../test/mocks/prisma.mock';
import { createMockUser } from '../../test/mocks/mock-factory';

const createConfigMock = () => ({
  getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
  get: jest.fn(),
});

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let configMock: ReturnType<typeof createConfigMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    configMock = createConfigMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('유효한 페이로드로 사용자를 반환한다', async () => {
      // Arrange
      const payload = { sub: 'user-123', role: 'USER' };
      const mockUser = {
        ...createMockUser({ id: 'user-123' }),
        organizations: [
          {
            organization: {
              id: 'org-1',
              name: '테스트 조직',
            },
          },
        ],
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: {
          organizations: {
            include: {
              organization: true,
            },
          },
        },
      });
    });

    it('ADMIN 역할의 사용자를 반환한다', async () => {
      // Arrange
      const payload = { sub: 'admin-123', role: 'ADMIN' };
      const mockAdmin = {
        ...createMockUser({ id: 'admin-123', role: 'ADMIN', name: '관리자' }),
        organizations: [],
      };

      prismaMock.user.findUnique.mockResolvedValue(mockAdmin);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual(mockAdmin);
      expect(result.role).toBe('ADMIN');
    });

    it('사용자가 존재하지 않으면 UnauthorizedException을 던진다', async () => {
      // Arrange
      const payload = { sub: 'non-existent-user', role: 'USER' };

      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        '사용자를 찾을 수 없습니다.',
      );
    });

    it('여러 조직에 속한 사용자를 반환한다', async () => {
      // Arrange
      const payload = { sub: 'user-multi-org', role: 'USER' };
      const mockUser = {
        ...createMockUser({ id: 'user-multi-org' }),
        organizations: [
          {
            organization: {
              id: 'org-1',
              name: '조직 1',
            },
          },
          {
            organization: {
              id: 'org-2',
              name: '조직 2',
            },
          },
        ],
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result.organizations).toHaveLength(2);
      expect(result.organizations[0].organization.id).toBe('org-1');
      expect(result.organizations[1].organization.id).toBe('org-2');
    });
  });

  describe('constructor', () => {
    it('JWT_SECRET을 ConfigService에서 가져온다', () => {
      // Assert
      expect(configMock.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
