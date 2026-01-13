import cn from '@/utils/cn';

interface ReservationButtonProps {
  disabled: boolean;
  onClick: () => void;
}

function ReservationButton({ disabled, onClick }: ReservationButtonProps) {
  return (
    <div className="border-neutral-border-default fixed bottom-0 left-0 right-0 border-t bg-white py-4">
      <div className="mx-auto w-full max-w-3xl px-4">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'text-16 w-full rounded-lg py-4 font-bold text-white transition',
            disabled
              ? 'bg-brand-surface-disabled cursor-not-allowed'
              : 'bg-brand-surface-default hover:bg-brand-400'
          )}
        >
          예약하기
        </button>
      </div>
    </div>
  );
}

export default ReservationButton;
