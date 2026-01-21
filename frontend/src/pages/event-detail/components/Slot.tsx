import type { EventSlot, SlotSchemaField } from '@/types/event';
import cn from '@/utils/cn';

interface SlotProps {
  isReservable: boolean;
  slot: EventSlot;
  fields: SlotSchemaField[];
  selectedSlotId: number | null;
  setSelectedSlotId: React.Dispatch<React.SetStateAction<number | null>>;
}

function Slot({ isReservable, slot, fields, selectedSlotId, setSelectedSlotId }: SlotProps) {
  const isClosed = slot.maxCapacity === slot.currentCount;
  const isSelected = selectedSlotId === slot.id;

  return (
    <button
      type="button"
      className={cn(
        'border-neutral-border-default flex h-12 w-full cursor-pointer items-center justify-between rounded-md border px-4 transition',
        isSelected && 'border-brand-border-default',
        isClosed && 'bg-neutral-surface-default text-neutral-text-secondary',
        (!isReservable || isClosed) && 'cursor-not-allowed',
      )}
      onClick={() => {
        if (isReservable && !isClosed) setSelectedSlotId(slot.id);
      }}
    >
      <div className="flex gap-1">
        {fields.map((field, idx) => {
          const value = slot.extraInfo?.[field.id] ?? '-';

          return (
            <div key={field.id} className="flex items-center gap-1">
              <div
                className={cn(
                  isSelected && 'text-brand-text-primary',
                  isClosed && 'text-neutral-text-secondary',
                )}
              >
                {value}
              </div>
              {idx < fields.length - 1 && <div className="text-neutral-border-default">|</div>}
            </div>
          );
        })}
      </div>
      <div className={cn('text-12', isClosed && 'text-error-text-primary')}>
        {isClosed ? '마감' : `${slot.currentCount}/${slot.maxCapacity}`}
      </div>
    </button>
  );
}

export default Slot;
