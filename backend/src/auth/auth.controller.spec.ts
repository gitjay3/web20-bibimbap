import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';

const createAuthServiceMock = () => ({
  validateInternalUser: jest.fn(),
  generateAccessToken: jest.fn().mockReturnValue('mock-jwt-token'),
  findOrCreateGithubUser: jest.fn(),
});

const createConfigServiceMock = () => ({
  get: jest.fn().mockReturnValue('development'),
  getOrThrow: jest.fn().mockImplementation((key: string) => {
    const config: Record<string, string> = {
      FRONTEND_URL: 'http://localhost:8080',
      JWT_EXPIRES_IN: '7d',
    };
    return config[key];
  }),
});

const createResponseMock = () => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
  redirect: jest.fn(),
});

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: ReturnType<typeof createAuthServiceMock>;
  let configServiceMock: ReturnType<typeof createConfigServiceMock>;

  beforeEach(async () => {
    authServiceMock = createAuthServiceMock();
    configServiceMock = createConfigServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'user-123',
                role: 'USER',
                name: 'Test User',
                organizations: [],
              }),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('로그인 성공 시 쿠키를 설정하고 성공 메시지를 반환한다', async () => {
      const mockUser = { id: 'user-123', role: 'USER' };
      const loginDto = { id: 'testuser', password: 'password123' };
      const resMock = createResponseMock();

      authServiceMock.validateInternalUser.mockResolvedValue(mockUser);

      const result = await controller.login(loginDto, resMock as any);

      expect(result).toEqual({ message: 'Login successful', role: 'USER' });
      expect(authServiceMock.validateInternalUser).toHaveBeenCalledWith(
        loginDto,
      );
      expect(authServiceMock.generateAccessToken).toHaveBeenCalledWith({
        id: 'user-123',
        role: 'USER',
      });
      expect(resMock.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        }),
      );
    });

    it('ADMIN 사용자 로그인 시 ADMIN 역할을 반환한다', async () => {
      const mockUser = { id: 'admin-123', role: 'ADMIN' };
      const loginDto = { id: 'admin', password: 'adminpass' };
      const resMock = createResponseMock();

      authServiceMock.validateInternalUser.mockResolvedValue(mockUser);

      const result = await controller.login(loginDto, resMock as any);

      expect(result.role).toBe('ADMIN');
    });
  });

  describe('githubCallback', () => {
    it('GitHub 콜백 시 쿠키를 설정하고 프론트엔드로 리다이렉트한다', () => {
      const mockUser = { id: 'user-123', role: 'USER' };
      const resMock = createResponseMock();

      controller.githubCallback(mockUser as any, resMock as any);

      expect(authServiceMock.generateAccessToken).toHaveBeenCalledWith({
        id: 'user-123',
        role: 'USER',
      });
      expect(resMock.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
        }),
      );
      expect(resMock.redirect).toHaveBeenCalledWith('http://localhost:8080');
    });
  });

  describe('logout', () => {
    it('로그아웃 시 쿠키를 제거하고 프론트엔드로 리다이렉트한다', () => {
      const resMock = createResponseMock();

      controller.logout(resMock as any);

      expect(resMock.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({
          httpOnly: true,
        }),
      );
      expect(resMock.redirect).toHaveBeenCalledWith('http://localhost:8080');
    });
  });

  describe('getMe', () => {
    it('현재 사용자 정보를 반환한다', async () => {
      // async 추가
      const mockUser = { id: 'user-123', role: 'USER', name: 'Test User' };
      const fullUser = {
        id: 'user-123',
        role: 'USER',
        name: 'Test User',
        organizations: [],
      };

      // prisma mock 수정 필요
      // PrismaService mock이 user.findUnique를 반환하도록 설정되어야 함

      const result = await controller.getMe(mockUser as any); // await 추가

      expect(result).toEqual(fullUser);
    });
  });
});
