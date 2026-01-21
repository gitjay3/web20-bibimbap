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
}

function SlotList({
  status,
  slotSchema,
  slots,
  selectedSlotId,
  setSelectedSlotId,
  disabled = false,
}: SlotListProps) {
  const orderedSchemaEntries = FIELD_ORDER.filter((key) => key in slotSchema).map((key) => ({
    key,
    field: slotSchema[key],
  }));

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-20 font-bold">예약 옵션</h3>
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
          />
        ))}
      </div>
    </div>
  );
}

export default SlotList;
