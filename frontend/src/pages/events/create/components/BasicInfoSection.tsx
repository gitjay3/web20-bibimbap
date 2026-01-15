import { useState } from 'react';
import Dropdown from '@/components/Dropdown';
import SectionCard from './SectionCard';

const trackOptions = [
  { key: 'ALL', label: '전체' },
  { key: 'COMMON', label: '공통' },
  { key: 'WEB', label: 'Web' },
  { key: 'ANDROID', label: 'Android' },
  { key: 'IOS', label: 'iOS' },
] as const;

type TrackValue = (typeof trackOptions)[number]['key'];

function BasicInfoSection() {
  const [field, setField] = useState<TrackValue>('ALL');

  return (
    <SectionCard title="기본 정보" description="이벤트의 기본적인 정보를 입력해주세요.">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div>분야</div>
          <Dropdown options={trackOptions} value={field} setValue={setField} className="max-w-60" />
        </div>

        <div className="flex flex-col gap-2">신청 유형</div>
        <div className="flex flex-col gap-2">대상 소속</div>
        <div className="flex flex-col gap-2">제목</div>
        <div className="flex flex-col gap-2">상세 설명</div>
      </div>
    </SectionCard>
  );
}

export default BasicInfoSection;
