import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import * as authApi from '@/api/auth';
import { customRender, userEvent } from '@/test/utils';

// 환경변수 모킹 - LoginPage import 전에 설정해야 함
vi.stubEnv('VITE_SHOW_INTERNAL_LOGIN', 'true');

// 동적 import로 환경변수 적용 후 모듈 로드
const { default: LoginPage } = await import('./LoginPage');

// SVG 모킹
vi.mock('@/assets/icons/github.svg?react', () => ({
  default: () => <span data-testid="github-icon">GitHub</span>,
}));

// API 모킹
vi.mock('@/api/auth');

describe('LoginPage', () => {
  const mockAdminLogin = vi.mocked(authApi.adminLogin);

  beforeEach(() => {
    vi.clearAllMocks();
    // window.location.href 모킹
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  describe('초기 렌더링', () => {
    it('로고와 제목을 표시한다', () => {
      customRender(<LoginPage />);

      expect(screen.getByAltText('로고')).toBeInTheDocument();
      expect(screen.getByText('bookstcamp')).toBeInTheDocument();
      expect(screen.getByText('부스트캠프 멤버들을 위한 예약 시스템')).toBeInTheDocument();
    });

    it('GitHub 로그인 버튼을 표시한다', () => {
      customRender(<LoginPage />);

      expect(screen.getByRole('button', { name: /GitHub로 계속하기/i })).toBeInTheDocument();
    });

    it('운영진 로그인 버튼을 표시한다', () => {
      customRender(<LoginPage />);

      expect(screen.getByRole('button', { name: '운영진 로그인' })).toBeInTheDocument();
    });
  });

  describe('GitHub 로그인', () => {
    it('GitHub 버튼 클릭 시 OAuth 페이지로 리다이렉트한다', async () => {
      const user = userEvent.setup();
      customRender(<LoginPage />);

      await user.click(screen.getByRole('button', { name: /GitHub로 계속하기/i }));

      expect(window.location.href).toBe('/api/auth/github');
    });
  });

  describe('운영진 로그인 폼', () => {
    it('운영진 로그인 버튼 클릭 시 로그인 폼을 표시한다', async () => {
      const user = userEvent.setup();
      customRender(<LoginPage />);

      await user.click(screen.getByRole('button', { name: '운영진 로그인' }));

      expect(screen.getByPlaceholderText('아이디')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    });

    it('취소 버튼 클릭 시 초기 화면으로 돌아간다', async () => {
      const user = userEvent.setup();
      customRender(<LoginPage />);

      await user.click(screen.getByRole('button', { name: '운영진 로그인' }));
      await user.click(screen.getByRole('button', { name: '취소' }));

      expect(screen.getByRole('button', { name: /GitHub로 계속하기/i })).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('아이디')).not.toBeInTheDocument();
    });

    it('아이디와 비밀번호를 입력할 수 있다', async () => {
      const user = userEvent.setup();
      customRender(<LoginPage />);

      await user.click(screen.getByRole('button', { name: '운영진 로그인' }));

      const idInput = screen.getByPlaceholderText('아이디');
      const passwordInput = screen.getByPlaceholderText('비밀번호');

      await user.type(idInput, 'admin');
      await user.type(passwordInput, 'password123');

      expect(idInput).toHaveValue('admin');
      expect(passwordInput).toHaveValue('password123');
    });

    it('로그인 성공 시 메인 페이지로 리다이렉트한다', async () => {
      mockAdminLogin.mockResolvedValue(undefined);
      const user = userEvent.setup();
      customRender(<LoginPage />);

      await user.click(screen.getByRole('button', { name: '운영진 로그인' }));
      await user.type(screen.getByPlaceholderText('아이디'), 'admin');
      await user.type(screen.getByPlaceholderText('비밀번호'), 'password123');
      await user.click(screen.getByRole('button', { name: '로그인' }));

      await waitFor(() => {
        expect(mockAdminLogin).toHaveBeenCalledWith({
          id: 'admin',
          password: 'password123',
        });
      });

      expect(window.location.href).toBe('/');
    });

    it('로그인 중 버튼 텍스트가 변경된다', async () => {
      mockAdminLogin.mockImplementation(() => new Promise(() => {})); // never resolves
      const user = userEvent.setup();
      customRender(<LoginPage />);

      await user.click(screen.getByRole('button', { name: '운영진 로그인' }));
      await user.type(screen.getByPlaceholderText('아이디'), 'admin');
      await user.type(screen.getByPlaceholderText('비밀번호'), 'password123');
      await user.click(screen.getByRole('button', { name: '로그인' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '로그인 중...' })).toBeInTheDocument();
      });
    });

    it('로그인 중 입력 필드가 비활성화된다', async () => {
      mockAdminLogin.mockImplementation(() => new Promise(() => {}));
      const user = userEvent.setup();
      customRender(<LoginPage />);

      await user.click(screen.getByRole('button', { name: '운영진 로그인' }));
      await user.type(screen.getByPlaceholderText('아이디'), 'admin');
      await user.type(screen.getByPlaceholderText('비밀번호'), 'password123');
      await user.click(screen.getByRole('button', { name: '로그인' }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('아이디')).toBeDisabled();
        expect(screen.getByPlaceholderText('비밀번호')).toBeDisabled();
      });
    });
  });
});
