import React, { useState } from 'react';
import type { EventSlot, SlotSchemaField, ApplicationUnit } from '@/types/event';
import type { ReservationApiResponse } from '@/types/BEapi';
import cn from '@/utils/cn';
import UserSearchIcon from '@/assets/icons/user-search.svg?react';
import DropdownMenu from '@/components/DropdownMenu';
import ReserverListModal from './ReserverListModal';

interface SlotProps {
  isReservable: boolean;
  slot: EventSlot;
  fields: SlotSchemaField[];
  selectedSlotId: number | null;
  setSelectedSlotId: React.Dispatch<React.SetStateAction<number | null>>;
  myReservation: ReservationApiResponse | null;
  applicationUnit: ApplicationUnit;
  isAdmin?: boolean;
  onEdit?: (slot: EventSlot) => void;
  onDelete?: (slot: EventSlot) => void;
}

function Slot({
  isReservable,
  slot,
  fields,
  selectedSlotId,
  setSelectedSlotId,
  myReservation,
  applicationUnit,
  isAdmin = false,
  onEdit,
  onDelete,
}: Omit<SlotProps, 'gridLayout'>) {
  const [isReserversModalOpen, setIsReserversModalOpen] = useState(false);
  const isClosed = slot.maxCapacity === slot.currentCount;
  const isReserved = myReservation?.slotId === slot.id;
  const isSelected = selectedSlotId === slot.id;
  const isDisabled = isAdmin ? false : isReserved || !isReservable || isClosed;

  const handleReserversClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReserversModalOpen(true);
  };

  const getStatusText = () => {
    if (isClosed) return '마감';
    return `${slot.currentCount}/${slot.maxCapacity}`;
  };

  const getStatusColorCls = () => {
    if (isReserved) return 'text-success-text-primary';
    if (isClosed) return 'text-error-text-primary';
    return 'text-brand-text-primary';
  };

  const renderReservations = () => {
    if (!slot.reservations || slot.reservations.length === 0) {
      return <span className="text-14">-</span>;
    }

    if (applicationUnit === 'TEAM') {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {slot.reservations.slice(0, 3).map((reservation, index) => (
            <span
              key={`group-${reservation.groupNumber}-${index}`}
              className="bg-brand-100 text-brand-700 text-12 inline-flex items-center rounded-full px-2 py-0.5 font-medium"
            >
              {reservation.groupNumber}그룹
            </span>
          ))}
          {slot.reservations.length > 3 && (
            <span className="text-14 text-neutral-text-tertiary">
              +{slot.reservations.length - 3}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center -space-x-2">
        {slot.reservations.slice(0, 3).map((reservation, index) => (
          <img
            key={`${reservation.username}-${index}`}
            className="bg-neutral-surface-default h-6 w-6 flex-shrink-0 rounded-full border-2 border-white object-cover"
            src={reservation.avatarUrl ?? undefined}
            alt={reservation.name}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ))}
        {slot.reservations.length > 3 && (
          <span className="text-14 text-neutral-text-tertiary flex-shrink-0 pl-2.5">
            +{slot.reservations.length - 3}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className="relative col-span-full grid w-full items-center gap-x-4"
        style={{ gridTemplateColumns: 'subgrid' }}
      >
        {/* 슬롯 선택 카드 (데이터 + 상태 영역만 포함) */}
        <button
          type="button"
          disabled={isDisabled}
          className={cn(
            'col-start-1 col-end-[-2] grid items-center gap-x-4 rounded-xl border px-6 py-3 transition-all duration-100',
            'border-neutral-border-default bg-white focus:outline-none',
            // 선택 상태
            isSelected && 'border-brand-500 bg-brand-50 ring-brand-500/50 shadow-sm ring-1',
            // 예약됨 상태 (Green)
            isReserved && 'border-success-border-default bg-success-surface-default shadow-sm',
            // 비활성/마감 상태
            isDisabled && !isReserved && 'bg-neutral-surface-default cursor-not-allowed opacity-60',
            // 호버 효과
            !isDisabled && !isSelected && 'hover:border-gray-300',
          )}
          style={{ gridTemplateColumns: 'subgrid' }}
          onClick={() => {
            if (!isDisabled) setSelectedSlotId(slot.id);
          }}
          title={isReserved ? '예약된 슬롯' : '슬롯 선택'}
          aria-label={isReserved ? '예약된 슬롯' : '슬롯 선택'}
        >
          {/* 데이터 필드들 (카드 내부) */}
          {fields.map((field) => {
            const value = slot.extraInfo?.[field.id] ?? '-';
            return (
              <div
                key={field.id}
                className={cn(
                  'text-16 text-neutral-text-secondary text-left break-all',
                  isClosed && 'text-neutral-text-tertiary',
                  isReserved && 'text-success-text-primary font-medium',
                )}
              >
                {value}
              </div>
            );
          })}

          {/* 예약자 열 (카드 내부) */}
          <div className="flex items-center justify-start">
            <div
              className={cn(
                'flex w-full items-center gap-x-2',
                isClosed ? 'text-neutral-text-tertiary' : 'text-neutral-text-secondary',
              )}
            >
              {renderReservations()}
            </div>
          </div>

          {/* 상태 표시 열 (카드 내부) */}
          <div className="flex items-center justify-start">
            <div
              className={cn(
                'flex h-7 items-center justify-center rounded-xl font-medium tracking-tight',
                getStatusColorCls(),
              )}
            >
              {getStatusText()}
            </div>
          </div>
        </button>

        {/* 액션 열 (카드 박스 '밖') */}
        <div className="flex items-center justify-center gap-1">
          {slot.reservations && slot.reservations.length > 0 && (
            <button
              type="button"
              className="hover:bg-neutral-surface-default text-neutral-text-tertiary hover:text-neutral-text-secondary rounded-full p-1.5 transition-colors active:scale-95"
              onClick={handleReserversClick}
              title="예약자 명단 상세 보기"
              aria-label="예약자 명단 상세 보기"
            >
              <UserSearchIcon className="h-5 w-5" />
            </button>
          )}
          {isAdmin && (
            <DropdownMenu
              items={[
                { label: '슬롯 수정', onClick: () => onEdit?.(slot) },
                { label: '슬롯 삭제', onClick: () => onDelete?.(slot), variant: 'danger' },
              ]}
            />
          )}
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

export default Slot;
