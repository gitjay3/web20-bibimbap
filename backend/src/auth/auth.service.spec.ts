import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/mocks/prisma.mock';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

const createJwtMock = () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let jwtMock: ReturnType<typeof createJwtMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    jwtMock = createJwtMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('사용자 정보로 JWT 토큰을 생성한다', () => {
      const user = { id: 'user-123', role: 'USER' };

      const token = service.generateAccessToken(user);

      expect(token).toBe('mock-jwt-token');
      expect(jwtMock.sign).toHaveBeenCalledWith({
        sub: 'user-123',
        role: 'USER',
      });
    });

    it('ADMIN 역할로 토큰을 생성한다', () => {
      const user = { id: 'admin-123', role: 'ADMIN' };

      service.generateAccessToken(user);

      expect(jwtMock.sign).toHaveBeenCalledWith({
        sub: 'admin-123',
        role: 'ADMIN',
      });
    });
  });

  describe('validateInternalUser', () => {
    const loginDto = { id: 'testuser', password: 'password123' };

    it('유효한 자격 증명으로 사용자를 반환한다', async () => {
      const mockUser = { id: 'user-123', role: 'USER', name: 'Test User' };
      const mockAuthAccount = {
        provider: 'INTERNAL',
        providerId: 'testuser',
        passwordHash: 'hashed-password',
        user: mockUser,
      };

      prismaMock.authAccount.findUnique.mockResolvedValue(mockAuthAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateInternalUser(loginDto);

      expect(result).toEqual(mockUser);
      expect(prismaMock.authAccount.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerId: {
            provider: 'INTERNAL',
            providerId: 'testuser',
          },
        },
        include: { user: true },
      });
    });

    it('계정이 존재하지 않으면 UnauthorizedException을 던진다', async () => {
      prismaMock.authAccount.findUnique.mockResolvedValue(null);

      await expect(service.validateInternalUser(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateInternalUser(loginDto)).rejects.toThrow(
        '존재하지 않는 계정입니다.',
      );
    });

    it('비밀번호가 일치하지 않으면 UnauthorizedException을 던진다', async () => {
      const mockAuthAccount = {
        provider: 'INTERNAL',
        providerId: 'testuser',
        passwordHash: 'hashed-password',
        user: { id: 'user-123' },
      };

      prismaMock.authAccount.findUnique.mockResolvedValue(mockAuthAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateInternalUser(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateInternalUser(loginDto)).rejects.toThrow(
        '비밀번호가 일치하지 않습니다.',
      );
    });

    it('passwordHash가 없으면 UnauthorizedException을 던진다', async () => {
      const mockAuthAccount = {
        provider: 'INTERNAL',
        providerId: 'testuser',
        passwordHash: null,
        user: { id: 'user-123' },
      };

      prismaMock.authAccount.findUnique.mockResolvedValue(mockAuthAccount);

      await expect(service.validateInternalUser(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('findOrCreateGithubUser', () => {
    const githubData = {
      githubId: '12345',
      githubLogin: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    };

    it('기존 GitHub 사용자가 있으면 반환한다', async () => {
      const mockUser = { id: 'user-123', role: 'USER', name: 'Test User' };
      const mockAuthAccount = {
        provider: 'GITHUB',
        providerId: '12345',
        user: mockUser,
      };

      prismaMock.authAccount.findUnique.mockResolvedValue(mockAuthAccount);
      prismaMock.adminInvitation.findFirst.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOrCreateGithubUser(githubData);

      expect(result).toEqual(mockUser);
    });

    it('새 GitHub 사용자를 생성한다 (사전등록 없음)', async () => {
      const mockNewUser = { id: 'new-user-123', role: 'USER' };

      prismaMock.authAccount.findUnique.mockResolvedValue(null);
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.camperPreRegistration.findMany.mockResolvedValue([]);
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          user: {
            create: jest.fn().mockResolvedValue(mockNewUser),
          },
          camperOrganization: {
            createMany: jest.fn(),
          },
          camperPreRegistration: {
            updateMany: jest.fn(),
          },
          adminInvitation: {
            findFirst: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          },
        };
        return callback(txMock);
      });

      const result = await service.findOrCreateGithubUser(githubData);

      expect(result).toEqual(mockNewUser);
    });

    it('새 GitHub 사용자를 생성하고 사전등록 정보를 연결한다', async () => {
      const mockNewUser = { id: 'new-user-123', role: 'USER' };
      const mockPreRegistration = {
        id: 'prereg-1',
        username: 'testuser',
        name: '테스트 유저',
        organizationId: 'org-123',
        camperId: 'K001',
        groupNumber: 1,
        status: 'INVITED',
      };

      prismaMock.authAccount.findUnique.mockResolvedValue(null);
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.camperPreRegistration.findMany.mockResolvedValue([
        mockPreRegistration,
      ]);

      const txMock = {
        user: {
          create: jest.fn().mockResolvedValue(mockNewUser),
        },
        camperOrganization: {
          createMany: jest.fn(),
        },
        camperPreRegistration: {
          updateMany: jest.fn(),
        },
        adminInvitation: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
      };

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(txMock),
      );

      const result = await service.findOrCreateGithubUser(githubData);

      expect(result).toEqual(mockNewUser);
      expect(txMock.camperOrganization.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: mockNewUser.id,
            organizationId: 'org-123',
            camperId: 'K001',
            groupNumber: 1,
          },
        ],
      });
      expect(txMock.camperPreRegistration.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['prereg-1'] } },
        data: {
          status: 'CLAIMED',
          claimedUserId: mockNewUser.id,
        },
      });
    });
  });
});
