import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import * as eventApi from '@/api/event';
import * as eventSlotApi from '@/api/eventSlot';
import * as reservationApi from '@/api/reservation';
import { renderAuthenticated, renderAsAdmin, userEvent, customRender } from '@/test/utils';
import type { EventDetail as EventDetailType, EventSlot, SlotSchema } from '@/types/event';
import useQueue from '@/hooks/useQueue';
import EventDetail from './EventDetail';

// API 모킹
vi.mock('@/api/event');
vi.mock('@/api/eventSlot');
vi.mock('@/api/reservation');
vi.mock('@/hooks/useQueue');

vi.mock('@/config/polling.config', () => ({
  default: {
    polling: {
      queueStatus: 60_000,
      eventDetail: 60_000,
    },
  },
}));

// react-router 모킹
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
  };
});

const createMockSlotSchema = (): SlotSchema => ({
  fields: [
    { id: 'content', name: '내용', type: 'text' },
    { id: 'startTime', name: '시작 시간', type: 'time' },
  ],
});

const createMockSlot = (overrides?: Partial<EventSlot>): EventSlot => ({
  id: 1,
  eventId: 1,
  maxCapacity: 5,
  currentCount: 2,
  version: 1,
  extraInfo: {
    content: 'React 멘토링',
    startTime: '14:00',
  },
  reservations: [],
  ...overrides,
});

const createMockEventDetail = (overrides?: Partial<EventDetailType>): EventDetailType => ({
  id: 1,
  title: '테스트 이벤트',
  description: '이벤트 설명입니다',
  track: 'WEB',
  applicationUnit: 'INDIVIDUAL',
  startTime: new Date('2026-01-20T10:00:00'),
  endTime: new Date('2026-01-30T18:00:00'),
  status: 'ONGOING',
  slotSchema: createMockSlotSchema(),
  slots: [createMockSlot()],
  ...overrides,
});

describe('EventDetail', () => {
  const mockGetEvent = vi.mocked(eventApi.getEvent);
  const mockGetSlotAvailability = vi.mocked(eventSlotApi.getSlotAvailability);
  const mockGetMyReservationForEvent = vi.mocked(reservationApi.getMyReservationForEvent);
  const mockUseQueue = vi.mocked(useQueue);

  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 모킹 설정
    mockGetEvent.mockResolvedValue(createMockEventDetail());
    mockGetSlotAvailability.mockResolvedValue({
      slots: [{ slotId: 1, currentCount: 2, remainingSeats: 3, isAvailable: true }],
      timestamp: '2026-01-25T10:00:00Z',
    });
    mockGetMyReservationForEvent.mockResolvedValue(null);
    mockUseQueue.mockReturnValue({
      position: null,
      totalWaiting: 0,
      hasToken: true,
      inQueue: true,
      tokenExpiresAt: null,
      isLoading: false,
      error: null,
      isNew: null,
      enter: vi.fn(),
      refetch: vi.fn(),
      sessionId: null,
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 로딩 메시지를 표시한다', async () => {
      mockGetEvent.mockImplementation(() => new Promise(() => {}));

      renderAuthenticated(<EventDetail />);

      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    });
  });

  describe('이벤트 정보 표시', () => {
    it('이벤트 제목을 표시한다', async () => {
      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '테스트 이벤트' })).toBeInTheDocument();
      });
    });

    it('이벤트 설명을 표시한다', async () => {
      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByText('이벤트 설명입니다')).toBeInTheDocument();
      });
    });

    it('존재하지 않는 이벤트일 때 에러 메시지를 표시한다', async () => {
      mockGetEvent.mockResolvedValue(null as unknown as EventDetailType);

      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByText('이벤트를 찾을 수 없습니다.')).toBeInTheDocument();
      });
    });
  });

  describe('예약 옵션 (슬롯 목록)', () => {
    it('예약 옵션 제목을 표시한다', async () => {
      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '예약 옵션' })).toBeInTheDocument();
      });
    });

    it('슬롯 스키마에 따라 컬럼 헤더를 표시한다', async () => {
      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByText('내용')).toBeInTheDocument();
        expect(screen.getByText('시작 시간')).toBeInTheDocument();
      });
    });

    it('슬롯 정보를 표시한다', async () => {
      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByText('React 멘토링')).toBeInTheDocument();
        expect(screen.getByText('14:00')).toBeInTheDocument();
      });
    });
  });

  describe('일반 사용자 뷰', () => {
    it('예약하기 버튼을 표시한다', async () => {
      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '예약하기' })).toBeInTheDocument();
      });
    });

    it('일정 추가 버튼을 표시하지 않는다', async () => {
      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByText('테스트 이벤트')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /일정 추가/i })).not.toBeInTheDocument();
    });

    it('토큰이 있을 때 예약 가능 메시지를 표시한다', async () => {
      mockUseQueue.mockReturnValue({
        position: null,
        totalWaiting: 0,
        hasToken: true,
        inQueue: true,
        tokenExpiresAt: null,
        isLoading: false,
        error: null,
        isNew: null,
        enter: vi.fn(),
        refetch: vi.fn(),
        sessionId: null,
      });

      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByText('현재 예약이 가능합니다!')).toBeInTheDocument();
      });
    });

    it('대기 중일 때 대기 순번을 표시한다', async () => {
      mockUseQueue.mockReturnValue({
        position: 4,
        totalWaiting: 10,
        hasToken: false,
        inQueue: true,
        tokenExpiresAt: null,
        isLoading: false,
        error: null,
        isNew: true,
        enter: vi.fn(),
        refetch: vi.fn(),
        sessionId: null,
      });

      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByText('현재 대기 순번')).toBeInTheDocument();
        expect(screen.getByText('5번')).toBeInTheDocument(); // position + 1
        expect(screen.getByText('전체 대기: 10명')).toBeInTheDocument();
      });
    });

    it('비로그인 상태일 때 로그인 필요 메시지를 표시한다', async () => {
      customRender(<EventDetail />, {
        auth: { user: null, isLoading: false },
      });

      await waitFor(() => {
        expect(screen.getByText('예약하려면 로그인이 필요합니다.')).toBeInTheDocument();
      });
    });
  });

  describe('관리자 뷰', () => {
    it('일정 추가 버튼을 표시한다', async () => {
      renderAsAdmin(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /일정 추가/i })).toBeInTheDocument();
      });
    });

    it('예약하기 버튼을 표시하지 않는다', async () => {
      renderAsAdmin(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByText('테스트 이벤트')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: '예약하기' })).not.toBeInTheDocument();
    });

    it('대기열 상태를 표시하지 않는다', async () => {
      renderAsAdmin(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByText('테스트 이벤트')).toBeInTheDocument();
      });

      expect(screen.queryByText('현재 예약이 가능합니다!')).not.toBeInTheDocument();
      expect(screen.queryByText('현재 대기 순번')).not.toBeInTheDocument();
    });
  });

  describe('이벤트 상태별 동작', () => {
    it('UPCOMING 이벤트일 때 대기열을 표시하지 않는다', async () => {
      mockGetEvent.mockResolvedValue(
        createMockEventDetail({
          status: 'UPCOMING',
          startTime: new Date('2026-02-01T10:00:00'),
          endTime: new Date('2026-02-10T18:00:00'),
        }),
      );

      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByText('테스트 이벤트')).toBeInTheDocument();
      });

      expect(screen.queryByText('현재 예약이 가능합니다!')).not.toBeInTheDocument();
      expect(screen.queryByText('대기열 확인 중...')).not.toBeInTheDocument();
    });

    it('ENDED 이벤트일 때 예약 기간이 아님을 표시한다', async () => {
      mockGetEvent.mockResolvedValue(
        createMockEventDetail({
          status: 'ENDED',
          startTime: new Date('2026-01-01T10:00:00'),
          endTime: new Date('2026-01-10T18:00:00'),
        }),
      );

      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '예약 기간이 아닙니다' })).toBeInTheDocument();
      });
    });
  });

  describe('예약 상호작용', () => {
    it('슬롯을 클릭하여 선택할 수 있다', async () => {
      const user = userEvent.setup();
      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByText('React 멘토링')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '예약하기' })).toBeInTheDocument();
      });

      // 슬롯 선택 버튼 클릭
      const slotButton = screen.getByRole('button', { name: '슬롯 선택' });
      await user.click(slotButton);

      // 슬롯이 선택되면 예약하기 버튼이 활성화됨
      await waitFor(() => {
        const reservationButton = screen.getByRole('button', { name: '예약하기' });
        expect(reservationButton).not.toBeDisabled();
      });
    });

    it('이미 예약이 있을 때 예약 취소 버튼을 표시한다', async () => {
      mockGetMyReservationForEvent.mockResolvedValue({
        id: 100,
        userId: 'user-1',
        slotId: 1,
        status: 'CONFIRMED',
        reservedAt: '2026-01-25T10:00:00Z',
      });

      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '예약 취소' })).toBeInTheDocument();
      });
    });
  });

  describe('여러 슬롯 표시', () => {
    it('여러 슬롯이 있을 때 모두 표시한다', async () => {
      mockGetEvent.mockResolvedValue(
        createMockEventDetail({
          slots: [
            createMockSlot({ id: 1, extraInfo: { content: 'React 멘토링', startTime: '14:00' } }),
            createMockSlot({ id: 2, extraInfo: { content: 'Vue 멘토링', startTime: '15:00' } }),
            createMockSlot({ id: 3, extraInfo: { content: 'Angular 멘토링', startTime: '16:00' } }),
          ],
        }),
      );

      renderAuthenticated(<EventDetail />);

      await waitFor(() => {
        expect(screen.getByText('React 멘토링')).toBeInTheDocument();
        expect(screen.getByText('Vue 멘토링')).toBeInTheDocument();
        expect(screen.getByText('Angular 멘토링')).toBeInTheDocument();
      });
    });
  });
});
