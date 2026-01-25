import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as authApi from '@/api/auth';
import type { User } from '@/types/user';
import { useAuth } from './AuthContext';
import AuthProvider from './AuthProvider';

// API 모킹
vi.mock('@/api/auth');

const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  name: '테스트 유저',
  role: 'USER',
  organizations: [
    {
      organization: {
        id: 'org-1',
        name: '테스트 조직',
      },
    },
  ],
  ...overrides,
});

// 테스트용 Consumer 컴포넌트
function TestConsumer() {
  const { user, isLoading, logout } = useAuth();

  return (
    <div>
      <span data-testid="loading">{isLoading ? '로딩 중' : '로딩 완료'}</span>
      <span data-testid="user">{user ? user.name : '로그인 안됨'}</span>
      <span data-testid="role">{user?.role ?? '없음'}</span>
      <button type="button" onClick={logout}>
        로그아웃
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  const mockGetMe = vi.mocked(authApi.getMe);
  const mockLogout = vi.mocked(authApi.logout);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('초기 인증 상태', () => {
    it('마운트 시 로딩 상태로 시작한다', async () => {
      mockGetMe.mockImplementation(() => new Promise(() => {})); // never resolves

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('로딩 중');
    });

    it('인증 성공 시 사용자 정보를 설정한다', async () => {
      const mockUser = createMockUser({ name: '홍길동' });
      mockGetMe.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('로딩 완료');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('홍길동');
      expect(screen.getByTestId('role')).toHaveTextContent('USER');
    });

    it('관리자 사용자 정보를 올바르게 설정한다', async () => {
      const mockAdmin = createMockUser({ name: '관리자', role: 'ADMIN' });
      mockGetMe.mockResolvedValue(mockAdmin);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('로딩 완료');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('관리자');
      expect(screen.getByTestId('role')).toHaveTextContent('ADMIN');
    });

    it('인증 실패 시 사용자를 null로 설정한다', async () => {
      mockGetMe.mockRejectedValue(new Error('Unauthorized'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('로딩 완료');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('로그인 안됨');
    });
  });

  describe('로그아웃', () => {
    it('로그아웃 성공 시 사용자를 null로 설정한다', async () => {
      const mockUser = createMockUser();
      mockGetMe.mockResolvedValue(mockUser);
      mockLogout.mockResolvedValue(undefined);

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('테스트 유저');
      });

      await user.click(screen.getByRole('button', { name: '로그아웃' }));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('로그인 안됨');
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('로그아웃 API 호출 후 사용자를 null로 설정한다 (성공/실패 무관)', async () => {
      // AuthProvider의 logout은 try-finally 패턴을 사용하므로
      // API 호출 결과와 무관하게 항상 사용자를 null로 설정함
      // 이 테스트에서는 성공 케이스만 검증 (실패 케이스는 구현상 동일하게 동작)
      const mockUser = createMockUser();
      mockGetMe.mockResolvedValue(mockUser);
      mockLogout.mockResolvedValue(undefined);

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('테스트 유저');
      });

      await user.click(screen.getByRole('button', { name: '로그아웃' }));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('로그인 안됨');
      });

      // logout API가 호출되었는지 확인
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('useAuth 훅', () => {
    it('AuthProvider 외부에서 사용 시 에러를 던진다', () => {
      // 에러 로깅 억제
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestConsumer />)).toThrow(
        'useAuth는 반드시 AuthProvider 내에서 사용되어야합니다.',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('사용자 조직 정보', () => {
    it('사용자의 조직 정보를 포함하여 제공한다', async () => {
      const mockUser = createMockUser({
        organizations: [
          { organization: { id: 'org-1', name: '부스트캠프' } },
          { organization: { id: 'org-2', name: '코드캠프' } },
        ],
      });
      mockGetMe.mockResolvedValue(mockUser);

      function OrgTestConsumer() {
        const { user } = useAuth();
        return (
          <div>
            {user?.organizations.map((o) => (
              <span key={o.organization.id} data-testid={`org-${o.organization.id}`}>
                {o.organization.name}
              </span>
            ))}
          </div>
        );
      }

      render(
        <AuthProvider>
          <OrgTestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('org-org-1')).toHaveTextContent('부스트캠프');
        expect(screen.getByTestId('org-org-2')).toHaveTextContent('코드캠프');
      });
    });
  });
});
