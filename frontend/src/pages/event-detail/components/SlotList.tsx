import type { EventSlot, SlotSchema, Status } from '@/types/event';
import Slot from './Slot';

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
  const fields = slotSchema.fields ?? [];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-20 font-bold">예약 옵션</h3>
      <div className="text-12 flex items-center gap-1">
        {fields.map((field, idx) => (
          <div key={field.id} className="flex items-center gap-1">
            <div className="text-neutral-text-secondary">{field.name}</div>
            {idx < fields.length - 1 && <div className="text-neutral-border-default">|</div>}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {slots.map((slot) => (
          <Slot
            key={slot.id}
            isReservable={status === 'ONGOING' && !disabled}
            slot={slot}
            fields={fields}
            selectedSlotId={selectedSlotId}
            setSelectedSlotId={setSelectedSlotId}
          />
        ))}
      </div>
    </div>
  );
}

export default SlotList;
