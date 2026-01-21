import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import type { EventFormValues } from '../../schema';
import SectionCard from '../SectionCard';
import TemplateSelectModal, { type Template, type SlotFieldType } from './TemplateSelectModal';
import SlotActionsBar from './SlotActionsBar';
import SlotTable from './SlotTable';

export default function SlotOptionsSection() {
  const { orgId } = useParams<{ orgId: string }>();

  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<EventFormValues>();

  const templateFields = (useWatch({
    control,
    name: 'slotSchema.fields',
  }) || []) as Array<{ id: string; name: string; type: SlotFieldType }>;

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'slots',
  });

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const templates: Template[] = useMemo(
    () => [
      {
        id: 'tpl_1',
        title: '시니어 리뷰어 피드백',
        description: '리뷰어와 시간을 선택하는 템플릿',
        tags: ['시작 시간', '리뷰어', '정원'],
        fields: [
          { id: 'f_1', name: '시작 시간', type: 'time' },
          { id: 'f_2', name: '리뷰어', type: 'text' },
        ],
      },
    ],
    [],
  );

  const buildDefaultSlotRow = (fieldsToUse: Array<{ id: string; type: SlotFieldType }>) => {
    const base = fieldsToUse.reduce(
      (acc, f) => ({ ...acc, [f.id]: f.type === 'number' ? 0 : '' }),
      {} as Record<string, unknown>,
    );
    return { ...base, capacity: 0 };
  };

  const handleAddSlot = () => {
    append(buildDefaultSlotRow(templateFields));
  };

  const handleSelectTemplate = (t: Template) => {
    setValue('slotSchema.fields', t.fields, { shouldDirty: true });
    replace([buildDefaultSlotRow(t.fields)]);
    setIsTemplateModalOpen(false);
  };

  const handleDownloadTemplate = () => {
    console.log('템플릿 서식 다운로드');
  };

  const manageTemplatesHref = `/orgs/${orgId}/templates`;

  return (
    <>
      <SectionCard title="선택지 목록" description="사용자가 선택할 수 있는 옵션을 등록하세요.">
        <div className="mb-4 flex items-end justify-between">
          <div className="min-h-4">
            {!!errors.slots && (
              <p className="text-12 text-error-text-primary font-medium">
                선택지의 모든 값을 입력해주세요.
              </p>
            )}
          </div>

          <SlotActionsBar
            onOpenTemplate={() => setIsTemplateModalOpen(true)}
            onDownloadTemplate={handleDownloadTemplate}
            onAddSlot={handleAddSlot}
          />
        </div>

        <SlotTable templateFields={templateFields} rows={fields} onRemove={remove} />
      </SectionCard>

      <TemplateSelectModal
        open={isTemplateModalOpen}
        templates={templates}
        manageTemplatesHref={manageTemplatesHref}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelect={handleSelectTemplate}
      />
    </>
  );
}
