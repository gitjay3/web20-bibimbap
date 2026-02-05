/* eslint-disable react/jsx-props-no-spreading */
import { useFormContext } from 'react-hook-form';
import type { EventFormValues } from '../schema';
import SectionCard from './SectionCard';

export default function ScheduleSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<EventFormValues>();

  const inputClass =
    'h-10 rounded-md border border-neutral-border-default px-3 text-14 outline-none transition-all focus:border-brand-border-default';

  return (
    <SectionCard title="일정 설정" description="예약 오픈 시간과 마감 시간을 설정해주세요.">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
        {/* 예약 오픈 섹션 */}
        <div className="flex flex-1 flex-col gap-2">
          <label htmlFor="openDate" className="text-14 font-medium text-neutral-text-primary sm:text-16">
            예약 오픈
          </label>
          <div className="flex gap-2">
            <input
              id="openDate"
              type="date"
              className={`${inputClass} flex-1 sm:flex-[2]`}
              {...register('openDate')}
            />
            <input
              type="time"
              aria-label="예약 오픈 시간"
              className={`${inputClass} flex-1 sm:w-32 sm:flex-none`}
              {...register('openTime')}
            />
          </div>

          {(errors.openDate || errors.openTime) && (
            <p className="text-12 text-error-text-primary mt-1">
              {errors.openDate?.message || errors.openTime?.message}
            </p>
          )}
        </div>

        {/* 예약 마감 섹션 */}
        <div className="flex flex-1 flex-col gap-2">
          <label htmlFor="closeDate" className="text-14 font-medium text-neutral-text-primary sm:text-16">
            예약 마감
          </label>
          <div className="flex gap-2">
            <input
              id="closeDate"
              type="date"
              className={`${inputClass} flex-1 sm:flex-[2]`}
              {...register('closeDate')}
            />
            <input
              type="time"
              aria-label="예약 마감 시간"
              className={`${inputClass} flex-1 sm:w-32 sm:flex-none`}
              {...register('closeTime')}
            />
          </div>

          {(errors.closeDate || errors.closeTime) && (
            <p className="text-12 text-error-text-primary mt-1">
              {errors.closeDate?.message || errors.closeTime?.message}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
