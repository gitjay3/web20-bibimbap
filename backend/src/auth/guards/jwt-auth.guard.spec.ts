import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const createMockExecutionContext = (
  path = '/api/test',
  overrides: Partial<{
    getHandler: jest.Mock;
    getClass: jest.Mock;
  }> = {},
): ExecutionContext => {
  const mockRequest = { path };
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

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('Public 데코레이터가 있으면 true를 반환한다', () => {
      // Arrange
      const context = createMockExecutionContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('/api/metrics 경로는 인증 없이 접근을 허용한다', () => {
      // Arrange
      const context = createMockExecutionContext('/api/metrics');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('Public 데코레이터가 없고 metrics 경로가 아니면 상위 canActivate를 호출한다', () => {
      // Arrange
      const context = createMockExecutionContext('/api/events');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      // super.canActivate를 모킹
      const superCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(superCanActivate).toHaveBeenCalledWith(context);
      expect(result).toBe(true);

      // Cleanup
      superCanActivate.mockRestore();
    });

    it('Public 데코레이터가 false면 상위 canActivate를 호출한다', () => {
      // Arrange
      const context = createMockExecutionContext('/api/reservations');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const superCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(superCanActivate).toHaveBeenCalled();
      expect(result).toBe(true);

      // Cleanup
      superCanActivate.mockRestore();
    });

    it('Public 데코레이터가 undefined면 상위 canActivate를 호출한다', () => {
      // Arrange
      const context = createMockExecutionContext('/api/users');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const superCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);

      // Act
      guard.canActivate(context);

      // Assert
      expect(superCanActivate).toHaveBeenCalled();

      // Cleanup
      superCanActivate.mockRestore();
    });
  });

  describe('메서드와 클래스 레벨 데코레이터 우선순위', () => {
    it('메서드 레벨 Public 데코레이터를 우선 확인한다', () => {
      // Arrange
      const mockHandler = jest.fn();
      const mockClass = jest.fn();
      const context = createMockExecutionContext('/api/test', {
        getHandler: jest.fn().mockReturnValue(mockHandler),
        getClass: jest.fn().mockReturnValue(mockClass),
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      // Act
      guard.canActivate(context);

      // Assert
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockHandler,
        mockClass,
      ]);
    });
  });
});
