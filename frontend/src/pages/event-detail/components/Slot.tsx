import type { EventSlot } from '@/types/event';
import cn from '@/utils/cn';

const FIELD_ORDER = ['content', 'startTime', 'endTime', 'location', 'mentor'];

function getOrderedEntries(extraInfo: Record<string, string>): { key: string; value: string }[] {
  return FIELD_ORDER
    .filter((key) => key in extraInfo)
    .map((key) => ({ key, value: extraInfo[key] }));
}

interface SlotProps {
  isReservable: boolean;
  slot: EventSlot;
  selectedSlotId: number | null;
  setSelectedSlotId: React.Dispatch<React.SetStateAction<number | null>>;
}

function Slot({ isReservable, slot, selectedSlotId, setSelectedSlotId }: SlotProps) {
  const isClosed = slot.maxCapacity === slot.currentCount;
  const isSelected = selectedSlotId === slot.id;
  const orderedEntries = getOrderedEntries(slot.extraInfo);

  return (
    <button
      type="button"
      className={cn(
        'border-neutral-border-default flex h-12 w-full cursor-pointer items-center justify-between rounded-md border px-4 transition',
        isSelected && 'border-brand-border-default',
        (isClosed) && 'bg-neutral-surface-default text-neutral-text-secondary',
        (!isReservable || isClosed) && 'cursor-not-allowed',
      )}
      onClick={() => {
        if (isReservable && !isClosed) {
          setSelectedSlotId(slot.id);
        }
      }}
    >
      <div className="flex gap-1">
        {orderedEntries.map((entry, idx) => (
          <div key={entry.key} className="flex items-center gap-1">
            <div
              className={cn(
                isSelected && 'text-brand-text-primary',
                isClosed && 'text-neutral-text-secondary',
              )}
            >
              {entry.value}
            </div>
            {idx < orderedEntries.length - 1 && (
              <div className="text-neutral-border-default">|</div>
            )}
          </div>
        ))}
      </div>
      <div className={cn('text-12', isClosed && 'text-error-text-primary')}>
        {isClosed ? '마감' : `${slot.currentCount}/${slot.maxCapacity}`}
      </div>
    </button>
  );
}

export default Slot;
