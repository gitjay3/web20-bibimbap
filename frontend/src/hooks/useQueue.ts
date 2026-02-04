import { useState, useEffect, useCallback, useRef } from 'react';
import { enterQueue, getQueueStatus } from '@/api/queue';
import CONFIG from '@/config/polling.config';

interface UseQueueOptions {
  eventId: number;
  enabled?: boolean; // 폴링 활성화 여부
}

interface QueueState {
  position: number | null;
  totalWaiting: number;
  hasToken: boolean;
  inQueue: boolean;
  isLoading: boolean;
  error: string | null;
  isNew: boolean | null;
  tokenExpiresAt: number | null;
}

function useQueue({ eventId, enabled = true }: UseQueueOptions) {
  const [state, setState] = useState<QueueState>({
    position: null,
    totalWaiting: 0,
    hasToken: false,
    inQueue: false,
    isLoading: true,
    error: null,
    isNew: null,
    tokenExpiresAt: null,
  });

  const sessionIdRef = useRef<string | null>(null);
  const hasEnteredRef = useRef<boolean>(false);

  // 상태 조회 (폴링용)
  const fetchStatus = useCallback(async () => {
    try {
      const status = await getQueueStatus(eventId);
      setState((prev) => ({
        ...prev,
        position: status.position,
        totalWaiting: status.totalWaiting,
        hasToken: status.hasToken,
        inQueue: status.inQueue,
        isLoading: false,
        error: null,
        tokenExpiresAt: status.tokenExpiresAt,
      }));
      return status;
    } catch (error) {
      console.error('대기열 상태 조회 실패:', error);
      return null;
    }
  }, [eventId]);

  // 대기열 진입
  const enter = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const result = await enterQueue(eventId);
      sessionIdRef.current = result.sessionId;

      setState((prev) => ({
        ...prev,
        position: result.position,
        totalWaiting: result.totalWaiting,
        hasToken: false,
        inQueue: true,
        isLoading: false,
        isNew: result.isNew,
        tokenExpiresAt: null,
      }));

      return result;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: '대기열 진입에 실패했습니다.',
      }));
      throw error;
    }
  }, [eventId]);

  useEffect(() => {
    if (enabled && !hasEnteredRef.current) {
      hasEnteredRef.current = true;
      enter();
    }
  }, [enabled, eventId, enter]);

  // 폴링 설정
  useEffect(() => {
    if (!enabled || !state.inQueue) {
      return undefined;
    }

    // 토큰을 받으면 폴링 중단
    if (state.hasToken) {
      return undefined;
    }

    const intervalId = setInterval(fetchStatus, CONFIG.polling.queueStatus);

    return () => clearInterval(intervalId);
  }, [enabled, state.inQueue, state.hasToken, fetchStatus]);
  return {
    ...state,
    enter,
    refetch: fetchStatus,
    sessionId: sessionIdRef.current,
  };
}

export default useQueue;
