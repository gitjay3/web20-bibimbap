import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent } from '@/test/utils';
import ManageReservationPage from './ManageReservationPage';

// SVG 모킹
vi.mock('@/assets/icons/user.svg?react', () => ({
  default: () => <span data-testid="user-icon">👤</span>,
}));

vi.mock('@/assets/icons/users.svg?react', () => ({
  default: () => <span data-testid="users-icon">👥</span>,
}));

// API 모킹
vi.mock('@/api/reservation', () => ({
  getMyReservations: vi.fn(() => Promise.resolve([])),
}));

describe('ManageReservationPage', () => {
  describe('페이지 헤더', () => {
    it('페이지 제목을 렌더링한다', async () => {
      renderWithRouter(<ManageReservationPage />);

      await waitFor(() => {
        expect(screen.getByText('예약 관리')).toBeInTheDocument();
      });
    });

    it('페이지 설명을 렌더링한다', async () => {
      renderWithRouter(<ManageReservationPage />);

      await waitFor(() => {
        expect(
          screen.getByText('신청한 이벤트 내역을 확인하고 예약을 관리하세요.'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('뷰 모드 토글', () => {
    it('토글 버튼들을 렌더링한다', async () => {
      renderWithRouter(<ManageReservationPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: '예약 현황' }),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByRole('button', { name: '다가오는 일정' }),
      ).toBeInTheDocument();
    });

    it('예약 현황 버튼 클릭 시 그리드 뷰로 전환된다', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ManageReservationPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '예약 현황' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '예약 현황' }));

      expect(
        screen.getByRole('heading', { name: '나의 예약 현황' }),
      ).toBeInTheDocument();
    });

    it('다가오는 일정 버튼 클릭 시 티켓 뷰로 전환된다', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ManageReservationPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '예약 현황' })).toBeInTheDocument();
      });

      // 먼저 그리드 뷰로 전환
      await user.click(screen.getByRole('button', { name: '예약 현황' }));

      // 다시 티켓 뷰로 전환
      await user.click(screen.getByRole('button', { name: '다가오는 일정' }));

      expect(screen.getByText('전체 예약 내역')).toBeInTheDocument();
    });
  });

  describe('티켓 뷰', () => {
    it('전체 예약 내역 섹션을 렌더링한다', async () => {
      renderWithRouter(<ManageReservationPage />);

      await waitFor(() => {
        expect(screen.getByText('전체 예약 내역')).toBeInTheDocument();
      });
    });
  });

  describe('그리드 뷰', () => {
    it('나의 예약 현황 제목을 렌더링한다', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ManageReservationPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '예약 현황' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '예약 현황' }));

      expect(
        screen.getByRole('heading', { name: '나의 예약 현황' }),
      ).toBeInTheDocument();
    });
  });
});
