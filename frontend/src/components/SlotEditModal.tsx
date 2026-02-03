import { useEffect, useState } from 'react';
import type { EventSlot, SlotSchema } from '@/types/event';

const FIELD_TYPE_TO_INPUT_TYPE: Record<string, string> = {
  time: 'time',
  date: 'date',
  number: 'number',
  text: 'text',
};

interface SlotEditModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  eventId?: number;
  slot: EventSlot | null;
  slotSchema: SlotSchema | undefined;
  onClose: () => void;
  onSave: (data: {
    slotId?: number;
    eventId?: number;
    maxCapacity: number;
    extraInfo: Record<string, unknown>;
  }) => Promise<void>;
}

function getButtonText(mode: 'create' | 'edit', isSubmitting: boolean) {
  if (mode === 'create') {
    return isSubmitting ? '추가 중...' : '추가하기';
  }
  return isSubmitting ? '저장 중...' : '저장하기';
}

export default function SlotEditModal({
  open,
  mode,
  eventId,
  slot,
  slotSchema,
  onClose,
  onSave,
}: SlotEditModalProps) {
  const [maxCapacity, setMaxCapacity] = useState<number>(1);
  const [extraInfo, setExtraInfo] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 폼 초기화 (수정, 생성)
  useEffect(() => {
    if (mode === 'edit' && slot) {
      setMaxCapacity(slot.maxCapacity);
      // extraInfo 값들을 문자열로 변환 (API에서 unknown 타입으로 올 수 있음)
      const stringifiedExtraInfo = Object.fromEntries(
        Object.entries(slot.extraInfo || {}).map(([k, v]) => [k, String(v ?? '')]),
      );
      setExtraInfo(stringifiedExtraInfo);
    } else if (mode === 'create') {
      setMaxCapacity(1);
      setExtraInfo({});
    }
  }, [mode, slot]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSubmit = async () => {
    if (mode === 'edit' && !slot) return;
    if (mode === 'create' && !eventId) return;

    setIsSubmitting(true);
    try {
      await onSave({
        slotId: mode === 'edit' ? slot?.id : undefined,
        eventId: mode === 'create' ? eventId : undefined,
        maxCapacity,
        extraInfo,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;
  if (mode === 'edit' && !slot) return null;

  const minCapacity = mode === 'edit' && slot ? slot.currentCount || 1 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        role="button"
        tabIndex={0}
        aria-label="모달 닫기"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose();
        }}
      />

      <div className="relative z-10 max-h-[80vh] w-120 overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{mode === 'create' ? '일정 추가' : '일정 수정'}</h2>

        <div className="mt-4 flex flex-col gap-4">
          {(slotSchema?.fields ?? []).map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={`slot-field-${field.id}`}
                  className="text-neutral-text-primary block text-sm font-medium"
                >
                  {field.name}
                </label>
                <input
                  id={`slot-field-${field.id}`}
                  type={FIELD_TYPE_TO_INPUT_TYPE[field.type] || 'text'}
                  value={extraInfo[field.id] || ''}
                  onChange={(e) => setExtraInfo({ ...extraInfo, [field.id]: e.target.value })}
                  className="border-neutral-border-default mt-1 w-full rounded-md border px-3 py-2"
                />
              </div>
            ))}

          <div>
            <label
              htmlFor="slot-max-capacity"
              className="text-neutral-text-primary block text-sm font-medium"
            >
              정원
            </label>
            <input
              id="slot-max-capacity"
              type="number"
              min={minCapacity}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              className="border-neutral-border-default mt-1 w-full rounded-md border px-3 py-2"
            />
            {mode === 'edit' && slot && slot.currentCount > 0 && (
              <p className="text-neutral-text-secondary mt-1 text-xs">
                현재 예약: {slot.currentCount}명 (이보다 낮게 설정 불가)
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="border-neutral-border-default rounded-md border px-4 py-2 text-sm"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-brand-surface-default rounded-md px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {getButtonText(mode, isSubmitting)}
          </button>
        </div>
      </div>
    </div>
  );
}
