import type { EventSlot, SlotSchema, Status } from '@/types/event';
import Slot from './Slot';

interface SlotListProps {
  status: Status;
  slotSchema: SlotSchema;
  slots: EventSlot[];
  selectedSlotId: number | null;
  setSelectedSlotId: React.Dispatch<React.SetStateAction<number | null>>;
}

function SlotList({ status, slotSchema, slots, selectedSlotId, setSelectedSlotId }: SlotListProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-20 font-bold">예약 옵션</h3>
      <div className="text-12 flex items-center gap-1">
        {Object.entries(slotSchema).map(([_key, value], idx) => (
          <>
            <div className="text-neutral-text-secondary">{value.label}</div>
            {idx < Object.entries(slotSchema).length - 1 && (
              <div className="text-neutral-border-default">|</div>
            )}
          </>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {slots.map((slot) => (
          <Slot isReservable={status === 'ONGOING'} slot={slot} selectedSlotId={selectedSlotId} setSelectedSlotId={setSelectedSlotId} />
        ))}
      </div>
    </div>
  );
}

export default SlotList;
