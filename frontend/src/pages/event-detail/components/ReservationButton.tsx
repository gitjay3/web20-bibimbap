import cn from '@/utils/cn';

interface ReservationButtonProps {
  isReservable: boolean;
  selectedSlotId: number;
}

function ReservationButton({ isReservable, selectedSlotId }: ReservationButtonProps) {
  const disabled = selectedSlotId === null;

  return (
    <div className="border-neutral-border-default fixed right-0 bottom-0 left-0 flex justify-center border-t bg-white py-4">
      <button
        type="button"
        onClick={() => {
          if (isReservable && !disabled) {
            // TODO: 예약 요청 API 연동
          }
        }}
        disabled={!isReservable || disabled}
        className={cn(
          'bg-brand-surface-default h-12 w-160 cursor-pointer rounded-lg font-bold text-white transition',
          disabled && 'bg-brand-surface-disabled cursor-not-allowed',
          !isReservable &&
            'bg-neutral-surface-default text-neutral-text-tertiary cursor-not-allowed',
        )}
      >
        {isReservable ? '예약하기' : '예약 기간이 아닙니다'}
      </button>
    </div>
  );
}

export default ReservationButton;
