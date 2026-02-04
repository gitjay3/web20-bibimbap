/* eslint-disable react/jsx-props-no-spreading */
import TrashIcon from '@/assets/icons/trash.svg?react';
import { useFormContext } from 'react-hook-form';
import useIsMobile from '@/hooks/useIsMobile';
import type { SlotFieldType } from '@/types/event';
import type { EventFormValues } from '../../schema';

type Props = {
  templateFields: Array<{ id: string; name: string; type: SlotFieldType }>;
  rows: Array<{ id: string }>;
  onRemove: (index: number) => void;
  isInitializing?: boolean;
};

export default function SlotTable({
  templateFields,
  rows,
  onRemove,
  isInitializing = false,
}: Props) {
  const { register } = useFormContext<EventFormValues>();
  const isMobile = useIsMobile();

  const blockNegativeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', 'e', 'E'].includes(e.key)) e.preventDefault();
  };

  const numberRegisterOptions = {
    setValueAs: (v: string) => {
      if (v === '' || v === null) return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    },
  };

  const capacityRegisterOptions = {
    setValueAs: (v: string) => {
      if (v === '' || v === null) return undefined;
      const n = Number(v);
      if (Number.isNaN(n)) return undefined;
      return Math.max(1, n);
    },
  };

  const getPlaceholder = (field: { name: string; type: SlotFieldType }) => {
    if (field.type === 'number') return '0';
    if (field.type === 'date') return 'YYYY-MM-DD';
    if (field.type === 'time') return 'HH:MM';
    return `${field.name} 입력`;
  };

  const inputBaseClassName =
    'w-full rounded-md border border-neutral-border-default px-3 py-2 text-14 outline-none placeholder:text-neutral-text-tertiary focus:border-brand-border-default';

  if (rows.length === 0 && isInitializing) {
    return (
      <div className="border-neutral-border-default overflow-hidden rounded-lg border bg-white">
        <div className="text-14 text-neutral-text-tertiary px-4 py-10 text-center">
          선택지 목록을 불러오는 중...
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="border-neutral-border-default rounded-lg border bg-white">
        <div className="text-12 text-error-text-primary py-12 text-center font-medium">
          등록된 선택지가 없습니다. &apos;선택지 추가&apos; 버튼을 눌러주세요.
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {rows.map((row, rowIndex) => (
          <div
            key={row.id}
            className="border-neutral-border-default rounded-lg border bg-white p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-neutral-text-secondary text-13 font-medium">
                선택지 {rowIndex + 1}
              </span>
              <button type="button" onClick={() => onRemove(rowIndex)}>
                <TrashIcon className="text-neutral-text-tertiary h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {templateFields.map((field) => (
                <div key={field.id} className={templateFields.length === 1 ? 'col-span-2' : ''}>
                  <span className="text-neutral-text-tertiary mb-1 block text-12">
                    {field.name}
                  </span>
                  <input
                    {...register(
                      `slots.${rowIndex}.${field.id}` as const,
                      field.type === 'number' ? numberRegisterOptions : {},
                    )}
                    type={field.type === 'number' ? 'number' : field.type}
                    placeholder={getPlaceholder(field)}
                    onKeyDown={field.type === 'number' ? blockNegativeKey : undefined}
                    className={inputBaseClassName}
                  />
                </div>
              ))}
              <div className={templateFields.length % 2 === 0 ? 'col-span-2' : ''}>
                <span className="text-neutral-text-tertiary mb-1 block text-12">정원</span>
                <input
                  {...register(`slots.${rowIndex}.capacity` as const, capacityRegisterOptions)}
                  type="number"
                  min={1}
                  placeholder="1"
                  onKeyDown={blockNegativeKey}
                  className={inputBaseClassName}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border-neutral-border-default overflow-x-auto rounded-lg border">
        <table className="w-full min-w-max border-collapse">
          <thead>
            <tr className="bg-neutral-surface-default text-14 text-neutral-text-tertiary font-medium">
              <th className="w-16 py-3.5 text-center whitespace-nowrap">No.</th>

              {templateFields.map((field) => (
                <th key={field.id} className="min-w-40 px-4 py-3.5 text-left whitespace-nowrap">
                  {field.name}
                </th>
              ))}

              <th className="w-28 px-4 py-3.5 text-left whitespace-nowrap">정원</th>
              <th className="w-16 py-3.5 text-center whitespace-nowrap">삭제</th>
            </tr>
          </thead>

          <tbody className="divide-neutral-border-default divide-y bg-white">
            {rows.map((row, rowIndex) => (
              <tr key={row.id}>
                <td className="text-14 text-neutral-text-tertiary py-4 text-center">
                  {rowIndex + 1}
                </td>

                {templateFields.map((field) => (
                  <td key={field.id} className="px-2 py-2">
                    <input
                      {...register(
                        `slots.${rowIndex}.${field.id}` as const,
                        field.type === 'number' ? numberRegisterOptions : {},
                      )}
                      type={field.type === 'number' ? 'number' : field.type}
                      placeholder={getPlaceholder(field)}
                      onKeyDown={field.type === 'number' ? blockNegativeKey : undefined}
                      className={inputBaseClassName}
                    />
                  </td>
                ))}

                <td className="px-2 py-2">
                  <input
                    {...register(`slots.${rowIndex}.capacity` as const, capacityRegisterOptions)}
                    type="number"
                    min={1}
                    placeholder="1"
                    onKeyDown={blockNegativeKey}
                    className={inputBaseClassName}
                  />
                </td>

                <td className="py-2 text-center">
                  <button type="button" onClick={() => onRemove(rowIndex)}>
                    <TrashIcon className="text-neutral-text-tertiary h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
}
