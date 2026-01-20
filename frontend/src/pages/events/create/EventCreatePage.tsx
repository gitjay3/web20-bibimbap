import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '@/components/PageHeader';
import { useNavigate } from 'react-router';
import { eventSchema, type EventFormValues } from './schema';
import BasicInfoSection from './components/BasicInfoSection';
import ScheduleSection from './components/ScheduleSection';
import SlotOptionsSection from './components/SlotOptionsSection';

export default function EventCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const methods = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      track: 'COMMON',
      applyType: 'INDIVIDUAL',
      title: '',
      openTime: '10:00',
      closeTime: '18:00',
      slotSchema: { fields: [] },
      slots: [{}],
    },
  });

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        // TODO: 실제 API 호출
        const mockFieldsFromBackend: EventFormValues['slotSchema']['fields'] = [
          { id: 'f_1', name: '시간', type: 'time' },
          { id: 'f_2', name: '장소', type: 'text' },
          { id: 'f_3', name: '멘토', type: 'text' },
          { id: 'f_4', name: '정원', type: 'number' },
        ];

        methods.reset({
          ...methods.getValues(),
          slotSchema: { fields: mockFieldsFromBackend },
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [methods]);

  const onSubmit = (data: EventFormValues) => {
    // TODO: API 전송
    console.log('최종 전송 데이터:', data);
  };

  if (isLoading) return <div>로딩 중...</div>;

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
            onClick={() => navigate('/')}
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
