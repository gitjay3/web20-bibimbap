import { useState, memo } from 'react';
import { toast } from 'sonner';
import { createReservation, cancelReservation } from '@/api/reservation';
import cn from '@/utils/cn';
import type { ReservationApiResponse } from '@/types/BEapi';
import type { Track } from '@/types/event';

const TRACK_LABEL: Record<Track, string> = {
  ALL: '전체',
  COMMON: '공통',
  WEB: 'Web',
  IOS: 'iOS',
  ANDROID: 'Android',
};

interface ReservationButtonProps {
  eventId: number;
  isReservable: boolean;
  selectedSlotId: number | null;
  myReservation: ReservationApiResponse | null;
  onReservationSuccess: () => void;
  onCancelSuccess: () => void;
  canReserveByTrack?: boolean;
  eventTrack: Track;
  isInQueue?: boolean;
  isQueueLoading?: boolean;
  queueErrorMessage?: string | null;
}

function ReservationButton({
  eventId,
  isReservable,
  selectedSlotId,
  myReservation,
  onReservationSuccess,
  onCancelSuccess,
  canReserveByTrack = true,
  eventTrack,
  isInQueue = false,
  isQueueLoading = false,
  queueErrorMessage = null,
}: ReservationButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasReservation = Boolean(myReservation);

  const handleReservation = async () => {
    if (!isReservable || selectedSlotId === null) return;

    setIsSubmitting(true);

    try {
      await createReservation(eventId, selectedSlotId);

      toast.success('예약이 완료되었습니다!');

      onReservationSuccess();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'SLOT_FULL') {
          toast.error('정원이 마감되었습니다. 다른 슬롯을 선택해주세요.');
        } else if (error.message === 'NO_TOKEN') {
          toast.error('예약 권한이 만료되었습니다. 페이지를 새로고침합니다.');
          window.location.reload();
        }
      } else {
        toast.error('예약에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 예약 취소
  const handleCancel = async () => {
    if (!myReservation) return;

    setIsSubmitting(true);
    try {
      await cancelReservation(myReservation.id);
      toast.success('예약이 취소되었습니다.');
      onCancelSuccess();
    } catch (error) {
      console.error('예약 취소 실패:', error);
      toast.error('예약 취소에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClick = hasReservation ? handleCancel : handleReservation;

  // 트랙 불일치 여부
  const isTrackMismatch = !canReserveByTrack && eventTrack !== 'COMMON';

  let buttonText;
  if (isSubmitting) {
    buttonText = hasReservation ? '취소 중...' : '예약 중...';
  } else if (hasReservation) {
    buttonText = '예약 취소';
  } else if (isTrackMismatch) {
    buttonText = `${TRACK_LABEL[eventTrack]} 전용`;
  } else if (isReservable) {
    buttonText = '예약하기';
  } else if (isInQueue) {
    buttonText = '대기 중입니다';
  } else if (isQueueLoading) {
    buttonText = '대기열 확인 중...';
  } else if (queueErrorMessage) {
    buttonText = queueErrorMessage;
  } else {
    buttonText = '예약 기간이 아닙니다';
  }

  // 예약 취소는 항상, 신청은 슬롯 확인 후 + 트랙 일치 필요
  const disabled = hasReservation ? false : selectedSlotId === null || isTrackMismatch;
  const isClickable = hasReservation || (isReservable && !disabled && !isTrackMismatch);

  return (
    <div className="border-neutral-border-default fixed right-0 bottom-0 left-0 flex flex-col items-center gap-1 border-t bg-white py-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={!isClickable || isSubmitting}
        className={cn(
          'bg-brand-surface-default h-12 w-200 cursor-pointer rounded-lg font-bold text-white transition',
          hasReservation && 'bg-error-500 hover:bg-error-600',
          (disabled || isTrackMismatch) &&
            !hasReservation &&
            'bg-brand-surface-disabled cursor-not-allowed',
          !isReservable &&
            !hasReservation &&
            !isTrackMismatch &&
            'bg-neutral-surface-default text-neutral-text-tertiary cursor-not-allowed',
        )}
      >
        {buttonText}
      </button>
      {isTrackMismatch && !hasReservation && (
        <p className="text-12 text-gray-500">
          이 이벤트는 {TRACK_LABEL[eventTrack]} 캠퍼만 예약할 수 있습니다
        </p>
      )}
    </div>
  );
}

export default memo(ReservationButton);
