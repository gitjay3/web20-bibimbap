import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '@/components/PageHeader';
import toISODateTime from '@/utils/date';
import { createEvent, getEvent, updateEvent } from '@/api/event';
import type { EventSlot } from '@/types/event';
import { eventSchema, type EventFormValues } from './schema';
import BasicInfoSection from './components/BasicInfoSection';
import ScheduleSection from './components/ScheduleSection';
import SlotOptionsSection from './components/slot-options/SlotOptionsSection';

export default function EventCreatePage() {
  const navigate = useNavigate();
  const { orgId, eventId } = useParams<{ orgId: string; eventId?: string }>();
  const isEditMode = !!eventId;
  const [_isLoading, setIsLoading] = useState(true);
  const [_originalSlots, setOriginalSlots] = useState<EventSlot[]>([]);

  if (!orgId) {
    throw new Error('organizationId가 없습니다.');
  }

  const methods = useForm<EventFormValues>({
    resolver: isEditMode ? undefined : zodResolver(eventSchema), // TODO : slotSchema 통일 후 : 앞부분 삭제 요망
    defaultValues: {
      track: 'COMMON',
      applicationUnit: 'INDIVIDUAL',
      title: '',
      description: '',
      openDate: '',
      closeDate: '',
      openTime: '10:00',
      closeTime: '18:00',
      slotSchema: { fields: [] },
      slots: [],
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isEditMode) {
          // 수정 모드: 기존 이벤트 데이터 로드
          const event = await getEvent(Number(eventId));
          console.log('Backend slotSchema:', event.slotSchema);
          const startDate = event.startTime.toISOString().split('T')[0];
          const startTimeStr = event.startTime.toTimeString().slice(0, 5);
          const endDate = event.endTime.toISOString().split('T')[0];
          const endTimeStr = event.endTime.toTimeString().slice(0, 5);

          const convertedSlots = event.slots.map((slot) => ({
            ...slot.extraInfo,
            capacity: slot.maxCapacity,
            slotId: slot.id,
          }));

          setOriginalSlots(event.slots);

          methods.reset({
            track: event.track,
            applicationUnit: event.applicationUnit,
            title: event.title,
            description: event.description ?? '',
            openDate: startDate,
            closeDate: endDate,
            openTime: startTimeStr,
            closeTime: endTimeStr,
            slotSchema: event.slotSchema as unknown as EventFormValues['slotSchema'], // TODO: slotSchema 구조 적용하고 as~ 부분 지워야함
            slots: convertedSlots,
          });
        } else {
          // TODO: 실제 API 호출
          const mockFieldsFromBackend: EventFormValues['slotSchema']['fields'] = [
            { id: 'f_1', name: '시간', type: 'time' },
            { id: 'f_2', name: '장소', type: 'text' },
            { id: 'f_3', name: '멘토', type: 'text' },
          ];

          methods.reset((prev) => ({
            ...prev,
            slotSchema: { fields: mockFieldsFromBackend },
          }));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isEditMode, eventId, methods]);

  const onSubmit = async (data: EventFormValues) => {
    const startTime = toISODateTime(data.openDate, data.openTime);
    const endTime = toISODateTime(data.closeDate, data.closeTime);
    if (!startTime || !endTime) return;

    if (isEditMode) {
      // 수정 모드
      await updateEvent(Number(eventId), {
        title: data.title,
        description: data.description,
        track: data.track,
        applicationUnit: data.applicationUnit,
        startTime,
        endTime,
        slotSchema: data.slotSchema,
      });

      // TODO: 추후 SchemaSlot 일괄 수정 후 처리
      // // 슬롯 처리
      // const allowedFieldIds = new Set(data.slotSchema.fields.map((f) => f.id));

      // // 현재 폼의 슬롯 ID 목록
      // const currentSlotIds = new Set(
      //   data.slots
      //     .map((slot) => (slot as Record<string, unknown>).slotId as number | undefined)
      //     .filter((id): id is number => id !== undefined),
      // );

      // // 1. 삭제된 슬롯 처리 (원본에는 있지만 현재에는 없는 슬롯)
      // const deletePromises = originalSlots
      //   .filter((original) => !currentSlotIds.has(original.id))
      //   .map((slot) => deleteEventSlot(slot.id));

      // // 2. 업데이트 및 생성 처리
      // const upsertPromises = data.slots.map((slot) => {
      //   const extraInfo: Record<string, unknown> = {};
      //   Object.entries(slot).forEach(([k, v]) => {
      //     if (allowedFieldIds.has(k)) extraInfo[k] = v;
      //   });

      //   const capacityRaw = (slot as Record<string, unknown>).capacity;
      //   const maxCapacity = Number(capacityRaw ?? 1);
      //   const slotId = (slot as Record<string, unknown>).slotId as number | undefined;

      //   if (slotId) {
      //     // 기존 슬롯 업데이트
      //     return updateEventSlot(slotId, { maxCapacity, extraInfo });
      //   }
      //   // 새 슬롯 생성
      //   return createEventSlot({
      //     eventId: Number(eventId),
      //     maxCapacity,
      //     extraInfo,
      //   });
      // });

      // await Promise.all([...deletePromises, ...upsertPromises]);

      navigate(`/orgs/${orgId}/events/${eventId}`);
    } else {
      // 생성 모드
      const allowedFieldIds = new Set(data.slotSchema.fields.map((f) => f.id));

      const normalizedSlots = data.slots.map((slot) => {
        const extraInfo: Record<string, unknown> = {};

        Object.entries(slot).forEach(([k, v]) => {
          if (k === 'capacity') return;
          if (allowedFieldIds.has(k) && v !== undefined && v !== '') extraInfo[k] = v;
        });

        const capacityRaw = (slot as Record<string, unknown>).capacity;
        const maxCapacity = Math.max(1, Number(capacityRaw ?? 1) || 1);

        return { maxCapacity, extraInfo };
      });

      const payload = {
        organizationId: orgId,
        track: data.track,
        applicationUnit: data.applicationUnit,
        title: data.title,
        description: data.description,
        startTime,
        endTime,
        slotSchema: data.slotSchema,
        slots: normalizedSlots,
      };

      const created = await createEvent(payload);
      navigate(`/orgs/${orgId}/events/${created.id}`);
    }
  };

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit, (errors) => {
          console.log('Form validation errors:', errors);
          console.log('Current form values:', methods.getValues());
        })}
        className="mx-auto flex max-w-300 flex-col gap-8"
      >
        <PageHeader
          title={isEditMode ? '이벤트 수정' : '새 이벤트 만들기'}
          description={
            isEditMode ? '이벤트 정보를 수정합니다.' : '새로운 멘토링이나 특강 이벤트를 개설합니다.'
          }
        />

        <BasicInfoSection />
        <ScheduleSection />
        <SlotOptionsSection />

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border-neutral-border-default text-neutral-text-secondary h-12 rounded-md border bg-white px-5 text-sm font-semibold"
          >
            취소
          </button>
          <button
            type="submit"
            className="bg-brand-surface-default h-12 w-48 rounded-md font-semibold text-white"
          >
            {isEditMode ? '이벤트 수정하기' : '이벤트 생성하기'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
