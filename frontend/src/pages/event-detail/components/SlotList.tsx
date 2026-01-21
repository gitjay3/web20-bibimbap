import type { EventSlot, SlotSchema, Status } from '@/types/event';
import Slot from './Slot';

const FIELD_ORDER = ['content', 'eventDate', 'startTime', 'endTime', 'location', 'mentorName'];

interface SlotListProps {
  status: Status;
  slotSchema: SlotSchema;
  slots: EventSlot[];
  selectedSlotId: number | null;
  setSelectedSlotId: React.Dispatch<React.SetStateAction<number | null>>;
  disabled?: boolean;
  isAdmin?: boolean;
  onEditSlot?: (slot: EventSlot) => void;
  onDeleteSlot?: (slot: EventSlot) => void;
  onAddSlot?: () => void;
}

function SlotList({
  status,
  slotSchema,
  slots,
  selectedSlotId,
  setSelectedSlotId,
  disabled = false,
  isAdmin = false,
  onEditSlot,
  onDeleteSlot,
  onAddSlot,
}: SlotListProps) {
  const orderedSchemaEntries = FIELD_ORDER.filter((key) => key in slotSchema).map((key) => ({
    key,
    field: slotSchema[key],
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-20 font-bold">예약 옵션</h3>
        {isAdmin && onAddSlot && (
          <button
            type="button"
            onClick={onAddSlot}
            className="bg-brand-surface-default hover:bg-brand-surface-strong rounded-md px-3 py-1.5 text-sm font-medium text-white"
          >
            + 일정 추가
          </button>
        )}
      </div>
      <div className="text-12 flex items-center gap-1">
        {orderedSchemaEntries.map(({ key, field }, idx) => (
          <div key={key} className="flex items-center gap-1">
            <div className="text-neutral-text-secondary">{field.label}</div>
            {idx < orderedSchemaEntries.length - 1 && (
              <div className="text-neutral-border-default">|</div>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {slots.map((slot) => (
          <Slot
            key={slot.id}
            isReservable={status === 'ONGOING' && !disabled}
            slot={slot}
            selectedSlotId={selectedSlotId}
            setSelectedSlotId={setSelectedSlotId}
            isAdmin={isAdmin}
            onEdit={onEditSlot}
            onDelete={onDeleteSlot}
          />
        ))}
      </div>
    </div>
  );
}

export default SlotList;
