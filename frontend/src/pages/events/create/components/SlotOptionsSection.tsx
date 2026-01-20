/* eslint-disable react/jsx-props-no-spreading */
import { useFormContext, useFieldArray } from 'react-hook-form';
import PlusIcon from '@/assets/icons/plus.svg?react';
import TrashIcon from '@/assets/icons/trash.svg?react';
import UploadIcon from '@/assets/icons/upload.svg?react';
import TemplateIcon from '@/assets/icons/template.svg?react';
import type { EventFormValues } from '../schema';
import SectionCard from './SectionCard';

type SlotFieldType = 'text' | 'number' | 'time';

export default function SlotOptionsSection() {
  const { register, control, watch } = useFormContext<EventFormValues>();

  const templateFields = (watch('slotSchema.fields') || []) as Array<{
    id: string;
    name: string;
    type: SlotFieldType;
  }>;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'slots',
  });

  const getPlaceholder = (field: { name: string; type: SlotFieldType }) => {
    if (field.type === 'number') return '0';
    if (field.type === 'time') return 'HH:MM';
    return `예) ${field.name}`;
  };

  const blockNegativeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // number input에서 음수 입력을 유도하는 키 방지
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  return (
    <SectionCard title="선택지 목록" description="사용자가 선택할 수 있는 옵션을 등록하세요.">
      <div className="mb-4 flex items-end justify-end">
        <div className="flex gap-2">
          <button
            type="button"
            className="border-neutral-border-default text-neutral-text-primary text-14 flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 font-medium"
          >
            <TemplateIcon className="h-4 w-4" /> 템플릿 설정
          </button>
          <button
            type="button"
            className="text-neutral-text-primary border-neutral-border-default text-14 flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 font-medium"
          >
            <UploadIcon className="h-4 w-4" /> 엑셀 업로드
          </button>
          <button
            type="button"
            onClick={() => append({})}
            className="text-14 bg-brand-surface-default flex items-center gap-1.5 rounded-md px-4 py-2 font-medium text-white"
          >
            <PlusIcon className="h-4 w-4" /> 선택지 추가
          </button>
        </div>
      </div>

      {/* 선택지 테이블 */}
      <div className="border-neutral-border-default overflow-hidden rounded-lg border">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="text-14 bg-neutral-surface-default text-neutral-text-tertiary text-left font-medium">
              <th className="w-16 py-3.5 text-center">No.</th>
              {templateFields.map((field) => (
                <th key={field.id} className="px-4 py-3.5">
                  {field.name}
                </th>
              ))}
              <th className="w-16 py-3.5 text-center">삭제</th>
            </tr>
          </thead>

          <tbody className="divide-neutral-border-default divide-y">
            {fields.map((row, rowIndex) => (
              <tr key={row.id}>
                <td className="text-14 text-neutral-text-tertiary py-4 text-center">
                  {rowIndex + 1}
                </td>

                {templateFields.map((field) => {
                  const isNumber = field.type === 'number';
                  const isTime = field.type === 'time';

                  return (
                    <td key={field.id} className="px-2 py-2">
                      <input
                        {...register(`slots.${rowIndex}.${field.id}` as const, {
                          ...(isNumber
                            ? {
                                valueAsNumber: true,
                                min: 0,
                                setValueAs: (v) => {
                                  if (v === '' || v === null || v === undefined) return v;
                                  const n = Number(v);
                                  if (Number.isNaN(n)) return 0;
                                  return Math.max(0, n);
                                },
                              }
                            : {}),
                        })}
                        type={isTime ? 'time' : field.type}
                        min={isNumber ? 0 : undefined}
                        placeholder={getPlaceholder(field)}
                        onKeyDown={isNumber ? blockNegativeKey : undefined}
                        className="border-neutral-border-default text-14 focus:border-brand-border-default placeholder:text-neutral-text-tertiary w-full rounded-md border px-3 py-2 transition-all outline-none"
                      />
                    </td>
                  );
                })}

                <td className="py-2 text-center">
                  <button type="button" onClick={() => remove(rowIndex)}>
                    <TrashIcon className="text-neutral-text-tertiary mx-auto h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {fields.length === 0 && (
          <div className="text-14 text-neutral-text-tertiary py-12 text-center">
            등록된 선택지가 없습니다. &apos;선택지 추가&apos; 버튼을 눌러주세요.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
