import { useEffect, memo } from 'react';
import { toast } from 'sonner';

interface QueueStatusProps {
  position: number | null;
  totalWaiting: number;
  hasToken: boolean;
  tokenExpiresAt: number | null;
  isLoading: boolean;
  isNew: boolean | null;
}

function QueueStatus({
  position,
  totalWaiting,
  hasToken,
  tokenExpiresAt,
  isLoading,
  isNew,
}: QueueStatusProps) {
  // 토큰 만료 감지 → 새로고침
  useEffect(() => {
    if (!hasToken || !tokenExpiresAt) {
      return undefined;
    }

    const remainingMs = tokenExpiresAt - Date.now();

    if (remainingMs <= 0) {
      // 이미 만료됨
      toast.info('예약 토큰이 만료되어 새로고침합니다.');
      window.location.reload();
      return undefined;
    }

    // 만료 시점에 새로고침 예약
    const timeoutId = setTimeout(() => {
      toast.info('예약 토큰이 만료되어 새로고침합니다.');
      window.location.reload();
    }, remainingMs);

    return () => clearTimeout(timeoutId);
  }, [hasToken, tokenExpiresAt]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="border-neutral-border-default bg-neutral-surface-default rounded-lg border p-4">
        <p className="text-neutral-text-secondary text-center">대기열 확인 중...</p>
      </div>
    );
  }

  // 토큰 발급됨 - 예약 가능 상태
  if (hasToken) {
    return (
      <div className="flex flex-col gap-2 border-neutral-border-default bg-white rounded-lg border p-4">
        <div className="font-bold">현재 예약이 가능합니다!</div>
        <div className="text-12">슬롯을 선택하고 예약을 진행해주세요.</div>
      </div>
    );
  }

  // 대기 중 - 순번 표시
  if (position !== null) {
    return (
      <div className="border-neutral-border-default bg-neutral-surface-default rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🕐</span>
          <span className="font-bold">현재 대기 순번</span>
          {isNew === false && (
            <div className="text-neutral-text-secondary mt-1 text-center text-sm">
              이미 대기 중입니다. 순번이 유지됩니다.
            </div>
          )}
        </div>
        <p className="text-brand-text-default mt-2 text-center text-3xl font-bold">
          {position + 1}번
        </p>
        <p className="text-neutral-text-secondary mt-1 text-center text-sm">
          전체 대기: {totalWaiting}명
        </p>
      </div>
    );
  }

  return null;
}

export default memo(QueueStatus);
