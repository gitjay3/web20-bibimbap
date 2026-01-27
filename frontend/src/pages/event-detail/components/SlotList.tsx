import type {
  EventSlot,
  SlotSchema,
  Status,
  ApplicationUnit,
} from '@/types/event';
import type { ReservationApiResponse } from '@/types/BEapi';
import { sortSlotFields } from '@/constants/slot-field';
import Slot from './Slot';

interface SlotListProps {
  status: Status;
  slotSchema: SlotSchema;
  slots: EventSlot[];
  selectedSlotId: number | null;
  applicationUnit: ApplicationUnit;
  setSelectedSlotId: React.Dispatch<React.SetStateAction<number | null>>;
  myReservation: ReservationApiResponse | null;
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
  myReservation,
  applicationUnit,
  disabled = false,
  isAdmin = false,
  onEditSlot,
  onDeleteSlot,
  onAddSlot,
}: SlotListProps) {
  const fields = sortSlotFields(slotSchema.fields ?? []);

  // 마스터 그리드 설정: 내용에 맞추되 전체 너비를 고려하여 밸런스 조정
  const gridLayout = {
    gridTemplateColumns: `repeat(${fields.length}, minmax(max-content, 1fr)) minmax(100px, 0.8fr) minmax(80px, 0.5fr) 48px`,
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 제목 + 일정 추가 버튼 (관리자용) */}
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

      {/* 그리드 레이아웃 */}
      <div className="grid w-full gap-y-3" style={gridLayout}>
        {/* 헤더 */}
        <div
          className="col-span-full grid items-center gap-x-4 px-6 py-4"
          style={{ gridTemplateColumns: 'subgrid' }}
        >
          {fields.map((field) => (
            <span
              key={field.id}
              className="text-14 text-neutral-text-secondary text-left font-semibold"
            >
              {field.name}
            </span>
          ))}
          <span className="text-14 text-neutral-text-secondary text-left font-semibold">
            예약자
          </span>
          <span className="text-14 text-neutral-text-secondary text-left font-semibold">상태</span>
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
            applicationUnit={applicationUnit}
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
