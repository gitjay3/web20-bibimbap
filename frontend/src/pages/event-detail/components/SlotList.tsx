import type { EventSlot, SlotSchema, Status } from '@/types/event';
import type { ReservationApiResponse } from '@/types/BEapi';
import Slot from './Slot';

interface SlotListProps {
  status: Status;
  slotSchema: SlotSchema;
  slots: EventSlot[];
  selectedSlotId: number | null;
  setSelectedSlotId: React.Dispatch<React.SetStateAction<number | null>>;
  myReservation: ReservationApiResponse | null;
  disabled?: boolean;
}

function SlotList({
  status,
  slotSchema,
  slots,
  selectedSlotId,
  setSelectedSlotId,
  myReservation,
  disabled = false,
}: SlotListProps) {
  const fields = slotSchema.fields ?? [];

  // 마스터 그리드 설정: 내용에 맞추되 전체 너비를 고려하여 밸런스 조정
  const gridLayout = {
    gridTemplateColumns: `repeat(${fields.length}, minmax(max-content, 1fr)) minmax(100px, 0.8fr) minmax(80px, 0.5fr) 48px`,
  };

  return (
    <div 
      className="grid w-full gap-y-3" 
      style={gridLayout}
    >
      {/* 헤더 */}
      <div
        className="grid col-span-full items-center gap-x-4 px-6 py-4"
        style={{ gridTemplateColumns: 'subgrid' }}
      >
        {fields.map((field) => (
          <span key={field.id} className="text-14 font-semibold text-neutral-text-secondary text-left">
            {field.name}
          </span>
        ))}
        <span className="text-14 font-semibold text-neutral-text-secondary text-left">
          예약자
        </span>
        <span className="text-14 font-semibold text-neutral-text-secondary text-left">
          상태
        </span>
        <span /> {/* 액션 컬럼용 빈 헤더 */}
      </div>

      {/* 슬롯 리스트: 이제 Slot들이 직접 그리드 자식이 되어 subgrid가 동작함 */}
      {slots.map((slot) => (
        <Slot
          key={slot.id}
          isReservable={status === 'ONGOING' && !disabled}
          slot={slot}
          fields={fields}
          selectedSlotId={selectedSlotId}
          setSelectedSlotId={setSelectedSlotId}
          myReservation={myReservation}
        />
      ))}
    </div>
  );
}

export default SlotList;
