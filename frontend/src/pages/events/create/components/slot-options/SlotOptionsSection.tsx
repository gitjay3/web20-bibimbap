import { useEffect, useState } from 'react'; // useMemo 대신 useEffect, useState 추가
import { useParams } from 'react-router';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { getTemplates } from '@/api/template';
import type { Field, Template } from '@/types/template';
import type { EventFormValues } from '../../schema';
import SectionCard from '../SectionCard';
import TemplateSelectModal from './TemplateSelectModal';
import SlotActionsBar from './SlotActionsBar';
import SlotTable from './SlotTable';

export default function SlotOptionsSection() {
  const { orgId } = useParams<{ orgId: string }>();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<EventFormValues>();

  const templateFields = (useWatch({
    control,
    name: 'slotSchema.fields',
  }) || []) as Field[];

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'slots',
  });

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const data = await getTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('템플릿을 불러오는데 실패했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const buildDefaultSlotRow = (fieldsToUse: Field[]) => {
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
    const newFields = t.slotSchema.fields;
    setValue('slotSchema.fields', newFields, { shouldDirty: true });
    replace([buildDefaultSlotRow(newFields)]);
    setIsTemplateModalOpen(false);
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
            onAddSlot={handleAddSlot}
          />
        </div>

        <SlotTable templateFields={templateFields} rows={fields} onRemove={remove} />
      </SectionCard>

      <TemplateSelectModal
        open={isTemplateModalOpen}
        templates={templates}
        isLoading={isLoading}
        manageTemplatesHref={manageTemplatesHref}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelect={handleSelectTemplate}
      />
    </>
  );
}
