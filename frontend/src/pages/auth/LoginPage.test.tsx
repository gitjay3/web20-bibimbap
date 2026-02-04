import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { customRender, userEvent } from '@/test/utils';
import LoginPage from './LoginPage';

// SVG 모킹
vi.mock('@/assets/icons/github.svg?react', () => ({
  default: () => <span data-testid="github-icon">GitHub</span>,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  describe('GitHub 로그인', () => {
    it('GitHub 버튼 클릭 시 OAuth 페이지로 리다이렉트한다', async () => {
      const user = userEvent.setup();
      customRender(<LoginPage />);

      await user.click(screen.getByRole('button', { name: /GitHub로 계속하기/i }));

      expect(window.location.href).toBe('/api/auth/github');
    });
  });
});
