import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtUser } from '../types/jwt-user.type';

const createMockUser = (role: Role = 'USER'): JwtUser => ({
  id: 'user-123',
  name: '테스트 유저',
  role,
  organizations: [
    {
      organization: {
        id: 'org-1',
        name: '테스트 조직',
      },
    },
  ],
});

const createMockExecutionContext = (
  user?: JwtUser,
  overrides: Partial<{
    getHandler: jest.Mock;
    getClass: jest.Mock;
  }> = {},
): ExecutionContext => {
  const mockRequest = { user };
  return {
    getHandler: overrides.getHandler || jest.fn(),
    getClass: overrides.getClass || jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
    }),
    getType: jest.fn().mockReturnValue('http'),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    describe('역할 요구사항이 없는 경우', () => {
      it('Roles 데코레이터가 없으면 true를 반환한다', () => {
        // Arrange
        const context = createMockExecutionContext(createMockUser());
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });

      it('Roles 데코레이터가 빈 배열이면 true를 반환한다', () => {
        // Arrange
        const context = createMockExecutionContext(createMockUser());
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('사용자 인증 상태', () => {
      it('사용자가 없으면 false를 반환한다', () => {
        // Arrange
        const context = createMockExecutionContext(undefined);
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(false);
      });

      it('요청에 user 객체가 null이면 false를 반환한다', () => {
        // Arrange
        const mockRequest = { user: null };
        const context = {
          getHandler: jest.fn(),
          getClass: jest.fn(),
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue(mockRequest),
          }),
        } as unknown as ExecutionContext;

        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['USER']);

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('역할 기반 접근 제어', () => {
      it('USER 역할이 USER 요구사항을 충족하면 true를 반환한다', () => {
        // Arrange
        const context = createMockExecutionContext(createMockUser('USER'));
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['USER']);

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });

      it('ADMIN 역할이 ADMIN 요구사항을 충족하면 true를 반환한다', () => {
        // Arrange
        const context = createMockExecutionContext(createMockUser('ADMIN'));
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });

      it('USER 역할이 ADMIN 요구사항을 충족하지 못하면 false를 반환한다', () => {
        // Arrange
        const context = createMockExecutionContext(createMockUser('USER'));
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(false);
      });

      it('ADMIN 역할이 USER 요구사항을 충족하지 못하면 false를 반환한다', () => {
        // Arrange
        const context = createMockExecutionContext(createMockUser('ADMIN'));
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['USER']);

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('다중 역할 허용', () => {
      it('USER 또는 ADMIN을 허용하면 USER가 접근할 수 있다', () => {
        // Arrange
        const context = createMockExecutionContext(createMockUser('USER'));
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValue(['USER', 'ADMIN']);

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });

      it('USER 또는 ADMIN을 허용하면 ADMIN이 접근할 수 있다', () => {
        // Arrange
        const context = createMockExecutionContext(createMockUser('ADMIN'));
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValue(['USER', 'ADMIN']);

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('Reflector 호출 검증', () => {
      it('핸들러와 클래스에서 ROLES_KEY를 확인한다', () => {
        // Arrange
        const mockHandler = jest.fn();
        const mockClass = jest.fn();
        const context = createMockExecutionContext(createMockUser(), {
          getHandler: jest.fn().mockReturnValue(mockHandler),
          getClass: jest.fn().mockReturnValue(mockClass),
        });

        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

        // Act
        guard.canActivate(context);

        // Assert
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
          mockHandler,
          mockClass,
        ]);
      });
    });
  });
});
