import { useState, memo } from 'react';
import type { EventSlot, SlotSchemaField, ApplicationUnit } from '@/types/event';
import type { ReservationApiResponse } from '@/types/BEapi';
import cn from '@/utils/cn';
import UserSearchIcon from '@/assets/icons/user-search.svg?react';
import DropdownMenu from '@/components/DropdownMenu';
import ReserverListModal from './ReserverListModal';

interface SlotCardProps {
  slot: EventSlot;
  fields: SlotSchemaField[];
  isSelected: boolean;
  isReservable: boolean;
  myReservation: ReservationApiResponse | null;
  applicationUnit: ApplicationUnit;
  isAdmin?: boolean;
  onSelect: () => void;
  onEdit?: (slot: EventSlot) => void;
  onDelete?: (slot: EventSlot) => void;
}

function SlotCard({
  slot,
  fields,
  isSelected,
  isReservable,
  myReservation,
  applicationUnit,
  isAdmin = false,
  onSelect,
  onEdit,
  onDelete,
}: SlotCardProps) {
  const [isReserversModalOpen, setIsReserversModalOpen] = useState(false);
  const isClosed = slot.maxCapacity === slot.currentCount;
  const isReserved = myReservation?.slotId === slot.id;
  const isDisabled = isAdmin ? false : isReserved || !isReservable || isClosed;

  const getStatusText = () => {
    if (isClosed) return '마감';
    return `${slot.currentCount}/${slot.maxCapacity}`;
  };

  const getStatusBadgeClass = () => {
    if (isReserved) return 'bg-success-surface-default text-success-text-primary';
    if (isClosed) return 'bg-error-50 text-error-text-primary';
    return 'bg-brand-50 text-brand-text-primary';
  };

  const handleClick = () => {
    if (!isDisabled && !isAdmin) {
      onSelect();
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border px-4 py-3 transition-all',
          'border-neutral-border-default bg-white',
          isSelected && 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/50',
          isReserved && 'border-success-border-default bg-success-surface-default',
          isDisabled && !isReserved && 'bg-neutral-surface-default opacity-60',
          !isDisabled && !isSelected && 'cursor-pointer active:bg-gray-50',
        )}
      >
        {/* 필드 정보 */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {fields.map((field, idx) => {
            const value = slot.extraInfo?.[field.id] ?? '-';
            return (
              <div key={field.id} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-12 text-neutral-text-tertiary">{field.name}</span>
                <span
                  className={cn(
                    'truncate',
                    idx === 0 ? 'text-14 font-medium text-neutral-text-primary' : 'text-13 text-neutral-text-secondary',
                    isClosed && 'text-neutral-text-tertiary',
                    isReserved && 'text-success-text-primary',
                  )}
                >
                  {value}
                </span>
              </div>
            );
          })}
        </div>

        {/* 상태 + 액션 */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={cn('rounded-full px-2.5 py-1 text-13 font-bold', getStatusBadgeClass())}>
            {getStatusText()}
          </span>
          <div className="flex items-center gap-1">
            {slot.reservations && slot.reservations.length > 0 && (
              <button
                type="button"
                className="rounded-full p-1 text-neutral-text-tertiary hover:bg-neutral-surface-default hover:text-neutral-text-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReserversModalOpen(true);
                }}
                title="예약자 명단"
                aria-label="예약자 명단"
              >
                <UserSearchIcon className="h-4 w-4" />
              </button>
            )}
            {isAdmin && (
              <div role="presentation" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu
                  items={[
                    { label: '슬롯 수정', onClick: () => onEdit?.(slot) },
                    { label: '슬롯 삭제', onClick: () => onDelete?.(slot), variant: 'danger' },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ReserverListModal
        isOpen={isReserversModalOpen}
        onClose={() => setIsReserversModalOpen(false)}
        reservers={slot.reservations ?? []}
        applicationUnit={applicationUnit}
      />
    </>
  );
}

export default memo(SlotCard);
