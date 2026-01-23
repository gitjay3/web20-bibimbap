import { useEffect, useId } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '@/components/Modal';
import TextInput from '@/components/TextInput';
import Dropdown from '@/components/Dropdown';
import Button from '@/components/Button';
import type { Template, CreateTemplateDto } from '@/types/template';
import PlusIcon from '@/assets/icons/plus.svg?react';
import TrashIcon from '@/assets/icons/trash.svg?react';
import FloppyDiskIcon from '@/assets/icons/floppy-disk.svg?react';

const makeFieldId = () => crypto.randomUUID();

const templateSchema = z.object({
  title: z.string().min(1, '템플릿 이름을 입력해주세요.'),
  description: z.string().optional(),
  slotSchema: z.object({
    fields: z
      .array(
        z.object({
          id: z.string(),
          name: z.string().min(1, '필드 이름을 입력해주세요.'),
          type: z.enum(['text', 'number', 'time', 'datetime']),
        }),
      )
      .min(1, '최소 1개의 필드가 필요합니다.'),
  }),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const fieldTypeOptions = [
  { key: 'text' as const, label: '텍스트 (문자열)' },
  { key: 'number' as const, label: '숫자' },
  { key: 'time' as const, label: '시간 (HH:MM)' },
];

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTemplateDto) => Promise<void>;
  template?: Template | null;
}

function TemplateFormModal({ isOpen, onClose, onSave, template }: TemplateFormModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      description: '',
      slotSchema: {
        fields: [{ id: makeFieldId(), name: '', type: 'text' }],
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'slotSchema.fields',
  });

  useEffect(() => {
    if (template) {
      reset({
        title: template.title,
        description: template.description ?? '',
        slotSchema: template.slotSchema,
      });
    } else {
      reset({
        title: '',
        description: '',
        slotSchema: {
          fields: [{ id: makeFieldId(), name: '', type: 'text' }],
        },
      });
    }
  }, [template, reset, isOpen]);

  const onSubmit = async (data: TemplateFormValues) => {
    await onSave({
      title: data.title,
      description: data.description || undefined,
      slotSchema: data.slotSchema,
    });
    onClose();
  };

  const handleAddField = () => {
    append({ id: makeFieldId(), name: '', type: 'text' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 pt-4">
        {/* 템플릿 이름 + 설명 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor={titleId} className="text-16 mb-2 block font-bold">
              템플릿 이름
            </label>
            <TextInput
              id={titleId}
              placeholder="예: 시니어 멘토링"
              /* eslint-disable-next-line react/jsx-props-no-spreading */
              {...register('title')}
            />
            {errors.title && <p className="text-12 mt-1 text-red-500">{errors.title.message}</p>}
          </div>
          <div className="flex-1">
            <label htmlFor={descriptionId} className="text-16 mb-2 block font-bold">
              설명 (선택)
            </label>
            <TextInput
              id={descriptionId}
              placeholder="템플릿 용도 설명"
              /* eslint-disable-next-line react/jsx-props-no-spreading */
              {...register('description')}
            />
          </div>
        </div>

        {/* 필드 정의 섹션 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-16 font-bold">필드 정의</span>
            <button
              type="button"
              className="border-neutral-border-default text-neutral-text-secondary text-14 flex cursor-pointer items-center gap-1 rounded-md border bg-white px-3 py-1.5"
              onClick={handleAddField}
            >
              <PlusIcon className="h-4 w-4" />
              필드 추가
            </button>
          </div>

          {/* 테이블 헤더 */}
          <div className="border-neutral-border-default rounded-lg border">
            <div className="text-neutral-text-tertiary border-neutral-border-default text-12 flex border-b bg-gray-50">
              <div className="w-12 px-3 py-2 text-center">순서</div>
              <div className="flex-1 px-3 py-2">필드 이름 (화면에 표시될 이름)</div>
              <div className="w-44 px-3 py-2">데이터 타입</div>
              <div className="w-10" />
            </div>

            {/* 정원 기본 필드 (고정) */}
            <div className="border-neutral-border-default flex items-center border-b bg-gray-50/50">
              <div className="text-neutral-text-tertiary text-14 w-12 px-3 py-2 text-center">-</div>
              <div className="flex flex-1 items-center gap-2 px-3 py-2">
                <span className="text-neutral-text-secondary text-14">정원</span>
              </div>
              <div className="w-44 px-3 py-2">
                <span className="text-neutral-text-tertiary text-14">숫자</span>
              </div>
              <div className="w-10" />
            </div>

            {/* 필드 행들 */}
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border-neutral-border-default flex items-center border-b last:border-b-0"
              >
                <div className="text-neutral-text-secondary text-14 w-12 px-3 py-2 text-center">
                  {index + 1}
                </div>
                <div className="flex-1 px-3 py-2">
                  <TextInput
                    placeholder="예: 시작 시간, 멘토명"
                    /* eslint-disable-next-line react/jsx-props-no-spreading */
                    {...register(`slotSchema.fields.${index}.name`)}
                  />
                </div>
                <div className="w-44 px-3 py-2">
                  <Controller
                    name={`slotSchema.fields.${index}.type`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Dropdown
                        options={fieldTypeOptions}
                        value={controllerField.value}
                        setValue={controllerField.onChange}
                      />
                    )}
                  />
                </div>
                <div className="w-10 px-2">
                  <button
                    type="button"
                    className={`cursor-pointer ${
                      fields.length > 1
                        ? 'text-neutral-text-tertiary hover:text-red-500'
                        : 'cursor-not-allowed text-gray-300'
                    }`}
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {errors.slotSchema?.fields && (
            <p className="text-12 mt-1 text-red-500">
              {errors.slotSchema.fields.message || errors.slotSchema.fields.root?.message}
            </p>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3">
          <Button type="secondary" variant="outline" onClickHandler={onClose}>
            취소
          </Button>
          <Button type="secondary" htmlType="submit" disabled={isSubmitting}>
            <FloppyDiskIcon className="h-4 w-4" />
            저장
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default TemplateFormModal;
