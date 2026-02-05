import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { Role } from '@prisma/client';

const createConfigMock = () => ({
  getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
  get: jest.fn(),
});

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configMock: ReturnType<typeof createConfigMock>;

  beforeEach(async () => {
    configMock = createConfigMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('payload에서 id와 role을 추출하여 JwtUser를 반환한다', () => {
      const payload = { sub: 'user-123', role: Role.USER };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-123',
        role: Role.USER,
      });
    });

    it('ADMIN role payload를 올바르게 처리한다', () => {
      const payload = { sub: 'admin-123', role: Role.ADMIN };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 'admin-123',
        role: Role.ADMIN,
      });
    });
  });

  describe('constructor', () => {
    it('JWT_SECRET을 ConfigService에서 가져온다', () => {
      expect(configMock.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
