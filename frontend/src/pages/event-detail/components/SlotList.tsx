import type { EventSlot, SlotSchema, Status } from '@/types/event';
import Slot from './Slot';

const FIELD_LABELS: Record<string, string> = {
  content: '내용',
  startTime: '시작',
  endTime: '종료',
  location: '장소',
  mentor: '멘토',
};

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
        {slotSchema.fields.map((field, idx) => (
          <div key={field} className="flex items-center gap-1">
            <div className="text-neutral-text-secondary">{FIELD_LABELS[field] ?? field}</div>
            {idx < slotSchema.fields.length - 1 && (
              <div className="text-neutral-border-default">|</div>
            )}
          </div>
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
