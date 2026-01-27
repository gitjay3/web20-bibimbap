import { useEffect, useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import { toast } from 'sonner';
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

  const handleExcelUpload = async (file: File) => {
    const toastId = toast.loading('엑셀 파일을 분석하여 선택지 형식을 구성 중입니다...');

    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('워크시트를 찾을 수 없습니다.');
      }

      const headerRow = worksheet.getRow(1);
      const colCount = worksheet.columnCount;

      const newFields: Field[] = [];
      const fieldColMapping: { id: string; colIndex: number; type: Field['type'] }[] = [];
      let capacityColIndex = -1;

      // 1. 헤더 분석을 통한 동적 스키마(Fields) 생성
      for (let i = 1; i <= colCount; i += 1) {
        const headerName = headerRow.getCell(i).text.trim();

        if (headerName) {
          // 정원은 특별 필드로 처리
          if (headerName === '정원') {
            capacityColIndex = i;
          } else {
            const fieldId = `f_${newFields.length + 1}`;
            let type: Field['type'] = 'text';

            // 간단한 키워드 기반 타입 추론
            if (headerName.includes('날짜')) {
              type = 'date';
            } else if (headerName.includes('시간')) {
              type = 'time';
            }

            const newField: Field = {
              id: fieldId,
              name: headerName,
              type,
            };

            newFields.push(newField);
            fieldColMapping.push({ id: fieldId, colIndex: i, type });
          }
        }
      }

      if (newFields.length === 0) {
        toast.error('엑셀 상단에서 유효한 제목(헤더)을 찾을 수 없습니다.', { id: toastId });
        return;
      }

      // 2. 폼 스키마 업데이트 (기존 템플릿 필드를 업로드된 엑셀 구성으로 교체)
      setValue('slotSchema.fields', newFields, { shouldDirty: true });

      // 3. 데이터 행 분석
      const newSlots: Record<string, unknown>[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // 헤더 제외

        const slot: Record<string, unknown> = {};
        let hasData = false;

        fieldColMapping.forEach(({ id, colIndex, type }) => {
          const cell = row.getCell(colIndex);
          let value = cell.text.trim();

          // 엑셀 자체 날짜/시간 데이터 타입 처리
          if (cell.type === ExcelJS.ValueType.Date && cell.value instanceof Date) {
            const date = cell.value;
            if (type === 'time') {
              value = date.toTimeString().slice(0, 5);
            } else if (type === 'date') {
              [value] = date.toISOString().split('T');
            }
          }

          if (value) {
            slot[id] = value;
            hasData = true;
          } else {
            slot[id] = DEFAULT_VALUE_BY_TYPE[type] ?? '';
          }
        });

        if (hasData) {
          let capacity = 1;
          if (capacityColIndex !== -1) {
            const capValue = row.getCell(capacityColIndex).value;
            const parsedCap = Number(capValue);
            if (!Number.isNaN(parsedCap) && parsedCap > 0) {
              capacity = parsedCap;
            }
          }
          slot.capacity = capacity;
          newSlots.push(slot);
        }
      });

      if (newSlots.length === 0) {
        toast.error('업로드할 유효한 데이터 행이 없습니다.', { id: toastId });
        return;
      }

      // 4. 선택지 목록 교환
      replace(newSlots as EventFormValues['slots']);
      toast.success(
        `엑셀을 기반으로 ${newFields.length}개의 항목과 ${newSlots.length}개의 선택지를 구성했습니다.`,
        { id: toastId },
      );
    } catch (error) {
      console.error('Excel upload error:', error);
      toast.error('엑셀 파일 처리에 실패했습니다.', { id: toastId });
    }
  };

  return (
    <>
      <SectionCard
        title="선택지 목록"
        description={
          <div className="flex flex-col gap-3">
            <p>참가자가 선택할 수 있는 옵션(슬롯)을 등록하세요.</p>
            <div className="flex flex-col gap-1.5 text-14 bg-neutral-bg-secondary/50 rounded-lg p-3 border border-neutral-border-default/50">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-neutral-text-primary min-w-[52px]">템플릿</span>
                <span>기존 템플릿을 불러온 후 [선택지 추가] 버튼으로 직접 구성할 수 있습니다.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-neutral-text-primary min-w-[52px]">엑셀</span>
                <div className="flex flex-col gap-1">
                  <span>[엑셀 업로드]를 통해 선택지를 한 번에 등록할 수 있습니다.</span>
                  <span className="text-13 text-neutral-text-tertiary">
                    * 첫 행은 필드 이름, 이후 행은 선택지 데이터로 자동 인식됩니다.
                    * 필드 이름에 정원이 포함되어 있지 않을 경우 모든 선택지에 대해 정원 1로 설정됩니다.
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
      >
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
            onUploadExcel={handleExcelUpload}
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
