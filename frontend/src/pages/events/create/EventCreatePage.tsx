import { useNavigate, useParams } from 'react-router';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '@/components/PageHeader';
import toISODateTime from '@/utils/date';
import { createEvent } from '@/api/event';
import { eventSchema, type EventFormValues } from './schema';
import BasicInfoSection from './components/BasicInfoSection';
import ScheduleSection from './components/ScheduleSection';
import SlotOptionsSection from './components/slot-options/SlotOptionsSection';

export default function EventCreatePage() {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();

  if (!orgId) {
    throw new Error('organizationId가 없습니다.');
  }

  const methods = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
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

  const onSubmit = async (data: EventFormValues) => {
    const startTime = toISODateTime(data.openDate, data.openTime);
    const endTime = toISODateTime(data.closeDate, data.closeTime);
    if (!startTime || !endTime) return;

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
  };

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="mx-auto flex max-w-300 flex-col gap-8"
      >
        <PageHeader
          title="새 이벤트 만들기"
          description="새로운 멘토링이나 특강 이벤트를 개설합니다."
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
            이벤트 생성하기
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
