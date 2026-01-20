/* eslint-disable react/jsx-props-no-spreading */
import TrashIcon from '@/assets/icons/trash.svg?react';
import { useFormContext } from 'react-hook-form';
import type { EventFormValues } from '../../schema';
import type { SlotFieldType } from './TemplateSelectModal';

type Props = {
  templateFields: Array<{ id: string; name: string; type: SlotFieldType }>;
  rows: Array<{ id: string }>;
  onRemove: (index: number) => void;
};

export default function SlotTable({ templateFields, rows, onRemove }: Props) {
  const { register } = useFormContext<EventFormValues>();

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
      return Math.max(0, n);
    },
  };

  const getPlaceholder = (field: { name: string; type: SlotFieldType }) => {
    if (field.type === 'number') return '0';
    if (field.type === 'time') return 'HH:MM';
    return `${field.name} 입력`;
  };

  const inputBaseClassName =
    'w-full rounded-md border border-neutral-border-default px-3 py-2 text-14 outline-none placeholder:text-neutral-text-tertiary focus:border-brand-border-default';

  return (
    <div className="border-neutral-border-default overflow-x-auto rounded-lg border">
      <table className="w-full min-w-150 table-fixed border-collapse">
        <thead>
          <tr className="bg-neutral-surface-default text-14 text-neutral-text-tertiary font-medium">
            <th className="w-16 py-3.5 text-center">No.</th>
            {templateFields.map((field) => (
              <th key={field.id} className="px-4 py-3.5 text-left">
                {field.name}
              </th>
            ))}
            <th className="w-28 px-4 py-3.5 text-left">정원</th>
            <th className="w-16 py-3.5 text-center">삭제</th>
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
                  min={0}
                  placeholder="0"
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

      {rows.length === 0 && (
        <div className="text-12 text-error-text-primary py-12 text-center font-medium">
          등록된 선택지가 없습니다. &apos;선택지 추가&apos; 버튼을 눌러주세요.
        </div>
      )}
    </div>
  );
}
