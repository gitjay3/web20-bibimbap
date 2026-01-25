import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useQueue from './useQueue';
import * as queueApi from '@/api/queue';

vi.mock('@/api/queue');

describe('useQueue', () => {
  const mockEnterQueue = vi.mocked(queueApi.enterQueue);
  const mockGetQueueStatus = vi.mocked(queueApi.getQueueStatus);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enabled가 false일 때 대기열에 진입하지 않는다', () => {
    const { result } = renderHook(() => useQueue({ eventId: 1, enabled: false }));

    expect(mockEnterQueue).not.toHaveBeenCalled();
    expect(result.current.inQueue).toBe(false);
  });

  it('초기 상태가 올바르게 설정된다', () => {
    const { result } = renderHook(() => useQueue({ eventId: 1, enabled: false }));

    expect(result.current.position).toBeNull();
    expect(result.current.totalWaiting).toBe(0);
    expect(result.current.hasToken).toBe(false);
    expect(result.current.inQueue).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('enabled가 true일 때 enterQueue를 호출한다', async () => {
    mockEnterQueue.mockResolvedValue({
      position: 5,
      isNew: true,
      sessionId: 'session-123',
    });
    mockGetQueueStatus.mockResolvedValue({
      position: 5,
      totalWaiting: 10,
      hasToken: false,
      inQueue: true,
      tokenExpiresAt: null,
    });

    renderHook(() => useQueue({ eventId: 1, enabled: true }));

    await waitFor(() => {
      expect(mockEnterQueue).toHaveBeenCalledWith(1);
    });
  });

  it('enter 함수가 반환된다', () => {
    const { result } = renderHook(() => useQueue({ eventId: 1, enabled: false }));

    expect(typeof result.current.enter).toBe('function');
  });

  it('refetch 함수가 반환된다', () => {
    const { result } = renderHook(() => useQueue({ eventId: 1, enabled: false }));

    expect(typeof result.current.refetch).toBe('function');
  });
});
