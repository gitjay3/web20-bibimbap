import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { getTemplates } from '@/api/template';
import type { Field, Template } from '@/types/template';
import type { EventFormValues } from '../../schema';
import SectionCard from '../SectionCard';
import TemplateSelectModal from './TemplateSelectModal';
import SlotActionsBar from './SlotActionsBar';
import SlotTable from './SlotTable';

const FALLBACK_FIELDS: Field[] = [
  { id: 'f_time', name: '시간', type: 'time' },
  { id: 'f_place', name: '장소', type: 'text' },
  { id: 'f_mentor', name: '멘토', type: 'text' },
];

const DEFAULT_VALUE_BY_TYPE: Record<Field['type'], unknown> = {
  number: 0,
  text: '',
  date: '',
  time: '',
};

export default function SlotOptionsSection() {
  const { orgId } = useParams<{ orgId: string }>();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isInitializing, setIsInitializing] = useState(true);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<EventFormValues>();

  const templateFields = (useWatch({
    control,
    name: 'slotSchema.fields',
  }) || []) as Field[];

  const {
    fields: rows,
    append,
    remove,
    replace,
  } = useFieldArray({
    control,
    name: 'slots',
  });

  const manageTemplatesHref = useMemo(() => `/orgs/${orgId}/templates`, [orgId]);

  const buildDefaultSlotRow = (fieldsToUse: Field[]) => {
    const base = fieldsToUse.reduce(
      (acc, f) => {
        acc[f.id] = DEFAULT_VALUE_BY_TYPE[f.type] ?? '';
        return acc;
      },
      {} as Record<string, unknown>,
    );

    return { ...base, capacity: 1 };
  };

  useEffect(() => {
    if (!orgId) {
      return undefined;
    }

    let mounted = true;

    (async () => {
      setIsLoading(true);
      setIsInitializing(true);

      try {
        const data = await getTemplates();
        if (!mounted) return;

        setTemplates(data);

        // slotSchema.fields가 비어있을 때만 초기화
        if (templateFields.length === 0) {
          const initialFields =
            data?.[0]?.slotSchema?.fields?.length > 0 ? data[0].slotSchema.fields : FALLBACK_FIELDS;

          setValue('slotSchema.fields', initialFields, { shouldDirty: false });

          replace([buildDefaultSlotRow(initialFields)]);
        }
      } catch (e) {
        console.error('템플릿을 불러오는데 실패했습니다:', e);
        if (!mounted) return;

        if (templateFields.length === 0) {
          setValue('slotSchema.fields', FALLBACK_FIELDS, { shouldDirty: false });
          replace([buildDefaultSlotRow(FALLBACK_FIELDS)]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitializing(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const handleAddSlot = () => {
    if (templateFields.length === 0) return;
    append(buildDefaultSlotRow(templateFields));
  };

  const handleSelectTemplate = (t: Template) => {
    const newFields = t.slotSchema.fields;

    setValue('slotSchema.fields', newFields, { shouldDirty: true });
    replace([buildDefaultSlotRow(newFields)]);

    setIsTemplateModalOpen(false);
  };

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

        <SlotTable
          templateFields={templateFields}
          rows={rows}
          onRemove={remove}
          isInitializing={isInitializing || isLoading}
        />
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
