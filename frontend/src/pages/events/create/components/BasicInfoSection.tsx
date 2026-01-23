/* eslint-disable react/jsx-props-no-spreading */
import { useFormContext, Controller } from 'react-hook-form';
import Dropdown from '@/components/Dropdown';
import type { EventFormValues } from '../schema';
import SectionCard from './SectionCard';

export default function BasicInfoSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<EventFormValues>();

  return (
    <SectionCard title="기본 정보" description="이벤트의 기본적인 정보를 입력해주세요.">
      <div className="flex flex-col gap-6">
        {/* 분야 */}
        <div className="flex flex-col gap-2">
          <span className="text-16 text-neutral-text-primary font-medium">분야</span>
          <Controller
            name="track"
            control={control}
            render={({ field }) => (
              <Dropdown
                options={[
                  { key: 'COMMON', label: '공통' },
                  { key: 'WEB', label: 'Web' },
                  { key: 'ANDROID', label: 'Android' },
                  { key: 'IOS', label: 'iOS' },
                ]}
                value={field.value}
                setValue={field.onChange}
                className="max-w-60"
              />
            )}
          />
        </div>

        {/* 신청 유형 */}
        <div className="flex flex-col gap-2">
          <span className="text-16 text-neutral-text-primary font-medium">신청 유형</span>
          <div className="flex gap-6">
            {['INDIVIDUAL', 'TEAM'].map((type) => (
              <label key={type} className="text-14 flex cursor-pointer items-center gap-2">
                <input
                  {...register('applicationUnit')}
                  type="radio"
                  value={type}
                  className="h-4 w-4"
                />
                {type === 'INDIVIDUAL' ? '개인 신청' : '팀 신청'}
              </label>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-16 text-neutral-text-primary font-medium">
            제목
          </label>
          <input
            id="title"
            {...register('title')}
            placeholder="예 : 3주차 시니어 멘토링"
            className="border-neutral-border-default text-14 focus:border-brand-border-default h-10 w-full rounded-lg border px-3 transition-all outline-none"
          />
          {errors.title && (
            <p className="text-12 text-error-text-primary">{errors.title.message}</p>
          )}
        </div>

        {/* 상세 설명 */}
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-16 text-neutral-text-primary font-medium">
            상세 설명
          </label>
          <textarea
            id="description"
            {...register('description')}
            placeholder="이벤트에 대한 상세한 설명을 작성해주세요."
            rows={6}
            className="border-neutral-border-default text-14 focus:border-brand-border-default w-full resize-none rounded-lg border p-3 transition-all outline-none"
          />
        </div>
      </div>
    </SectionCard>
  );
}
