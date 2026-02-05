import { useEffect, useId } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '@/components/Modal';
import TextInput from '@/components/TextInput';
import Dropdown from '@/components/Dropdown';
import Button from '@/components/Button';
import useIsMobile from '@/hooks/useIsMobile';
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
          type: z.enum(['text', 'number', 'date', 'time']),
        }),
      )
      .min(1, '최소 1개의 필드가 필요합니다.'),
  }),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const fieldTypeOptions = [
  { key: 'text' as const, label: '텍스트 (문자열)' },
  { key: 'number' as const, label: '숫자' },
  { key: 'date' as const, label: '날짜 (YYYY-MM-DD)' },
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
  const isMobile = useIsMobile();

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
    // 각 필드에 고유 ID 생성 (f1, f2, f3, ...)
    const fieldsWithIds = data.slotSchema.fields.map((field, index) => ({
      ...field,
      id: `f${index + 1}`,
    }));

    await onSave({
      title: data.title,
      description: data.description || undefined,
      slotSchema: { fields: fieldsWithIds },
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
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label htmlFor={titleId} className="mb-2 block text-14 font-bold sm:text-16">
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
            <label htmlFor={descriptionId} className="mb-2 block text-14 font-bold sm:text-16">
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
            <span className="text-14 font-bold sm:text-16">필드 정의</span>
            <button
              type="button"
              className="border-neutral-border-default text-neutral-text-secondary flex cursor-pointer items-center gap-1 rounded-md border bg-white px-2 py-1 text-13 sm:px-3 sm:py-1.5 sm:text-14"
              onClick={handleAddField}
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">필드 추가</span>
              <span className="sm:hidden">추가</span>
            </button>
          </div>

          {/* 정원 기본 필드 (고정) - 모바일/데스크톱 공통 */}
          <div className="border-neutral-border-default mb-2 rounded-lg border bg-gray-50/50 px-3 py-2">
            <div className="text-neutral-text-tertiary flex items-center justify-between text-13">
              <span>정원 (기본 필드)</span>
              <span>숫자</span>
            </div>
          </div>

          {/* 모바일: 카드 레이아웃 / 데스크톱: 테이블 레이아웃 */}
          {isMobile ? (
            <div className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border-neutral-border-default rounded-lg border bg-white p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-neutral-text-secondary text-13">필드 {index + 1}</span>
                    <button
                      type="button"
                      className={`${
                        fields.length > 1
                          ? 'text-neutral-text-tertiary active:text-red-500'
                          : 'cursor-not-allowed text-gray-300'
                      }`}
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <TextInput
                      placeholder="필드 이름"
                      /* eslint-disable-next-line react/jsx-props-no-spreading */
                      {...register(`slotSchema.fields.${index}.name`)}
                    />
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
                </div>
              ))}
            </div>
          ) : (
            <div className="border-neutral-border-default rounded-lg border">
            <div className="text-neutral-text-tertiary border-neutral-border-default flex border-b bg-gray-50 text-12">
              <div className="w-12 px-3 py-2 text-center">순서</div>
              <div className="flex-1 px-3 py-2">필드 이름</div>
              <div className="w-44 px-3 py-2">데이터 타입</div>
              <div className="w-10" />
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border-neutral-border-default flex items-center border-b last:border-b-0"
              >
                <div className="text-neutral-text-secondary w-12 px-3 py-2 text-center text-14">
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
          )}

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
