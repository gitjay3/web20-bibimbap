import { useState } from 'react';
import { toast } from 'sonner';
import { applyReservation, cancelReservation } from '@/api/reservation';
import cn from '@/utils/cn';
import type { ReservationApiResponse } from '@/types/BEapi';

interface ReservationButtonProps {
  isReservable: boolean;
  selectedSlotId: number | null;
  myReservation: ReservationApiResponse | null;
  onReservationSuccess: () => void;
  onCancelSuccess: () => void;
}

function ReservationButton({
  isReservable,
  selectedSlotId,
  myReservation,
  onReservationSuccess,
  onCancelSuccess,
}: ReservationButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasReservation = Boolean(myReservation);

  const handleReservation = async () => {
    if (!isReservable || selectedSlotId === null) return;

    setIsSubmitting(true);

    try {
      await applyReservation(selectedSlotId);

      toast.success('예약이 완료되었습니다!');

      onReservationSuccess();
    } catch (error) {
      console.error('예약 신청 실패:', error);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClick = hasReservation ? handleCancel : handleReservation;

  let buttonText;
  if (isSubmitting) {
    buttonText = hasReservation ? '취소 중...' : '예약 중...'; // TODO: 나중에 지연 보고 삭제 가능
  } else if (hasReservation) {
    buttonText = '예약 취소';
  } else if (isReservable) {
    buttonText = '예약하기';
  } else {
    buttonText = '예약 기간이 아닙니다';
  }

  // 예약 취소는 항상, 신청은 슬롯 확인 후
  const disabled = hasReservation ? false : selectedSlotId === null;
  const isClickable = hasReservation || (isReservable && !disabled);

  return (
    <div className="border-neutral-border-default fixed right-0 bottom-0 left-0 flex justify-center border-t bg-white py-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={!isClickable || isSubmitting}
        className={cn(
          'bg-brand-surface-default h-12 w-160 cursor-pointer rounded-lg font-bold text-white transition',
          hasReservation && 'bg-error-500 hover:bg-error-600',
          disabled && !hasReservation && 'bg-brand-surface-disabled cursor-not-allowed',
          !isReservable &&
            !hasReservation &&
            'bg-neutral-surface-default text-neutral-text-tertiary cursor-not-allowed',
        )}
      >
        {buttonText}
      </button>
    </div>
  );
}

export default ReservationButton;
