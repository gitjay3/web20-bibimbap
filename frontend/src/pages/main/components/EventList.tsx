import { useMemo, useState } from 'react';
import type { Event } from '@/types/event';
import Dropdown from '@/components/Dropdown';
import CategoryTabs from './CategoryTabs';
import EventCard from './EventCard';


const mockEventCards: Event[] = [
  {
    id:1,
    category: 'WEB',
    status: 'ONGOING',
    title: '1주차: 웹 풀스택 과정 멘토링',
    description:
      'React와 Node.js를 활용한 웹 풀스택 개발 기초를 다지는 시간입니다. 멘토님과 함께 코드 리뷰 및 아키텍처 설계를 진행합니다.',
    startAt: new Date('2026-01-15T14:00:00'),
    endAt: new Date('2026-01-15T18:00:00'),
    applicationUnit: 'INDIVIDUAL',
  },
  {
    id:2,
    category: 'ANDROID',
    status: 'ONGOING',
    title: '1주차: Android 코틀린 심화',
    description:
      '코틀린 코루틴과 비동기 처리에 대해 심도 있게 학습합니다. 실무에서 자주 발생하는 이슈를 중심으로 다룹니다.',
    startAt: new Date('2026-01-22T10:00:00'),
    endAt: new Date('2026-01-22T12:00:00'),
    applicationUnit: 'TEAM',
  },
  {
    id:3,
    category: 'IOS',
    status: 'ONGOING',
    title: '1주차: iOS 오토레이아웃 마스터',
    description:
      '복잡한 UI도 쉽게 구현할 수 있는 오토레이아웃 비법을 전수합니다. 다양한 해상도 대응 전략을 다룹니다.',
    startAt: new Date('2026-01-28T13:00:00'),
    endAt: new Date('2026-01-28T16:00:00'),
    applicationUnit: 'TEAM',
  },
  {
    id:4,
    category: 'ANDROID',
    status: 'UPCOMING',
    title: '2주차: Android 아키텍처 패턴',
    description: 'MVVM, Clean Architecture를 중심으로 안드로이드 앱 구조 설계 방법을 학습합니다.',
    startAt: new Date('2026-02-05T10:00:00'),
    endAt: new Date('2026-02-05T12:00:00'),
    applicationUnit: 'INDIVIDUAL',
  },
  {
    id:5,
    category: 'ANDROID',
    status: 'ENDED',
    title: '0주차: Android 개발 환경 세팅',
    description: '안드로이드 개발을 위한 기본 환경 세팅과 필수 도구 사용법을 안내합니다.',
    startAt: new Date('2026-01-08T10:00:00'),
    endAt: new Date('2026-01-08T12:00:00'),
    applicationUnit: 'INDIVIDUAL',
  },
];

type EventCategoryFilter = 'ALL' | Event['category']
type EventStatusFilter = 'ALL' | Event['status'];

function EventList() {
  const categoryTabsItems = [
    { key: 'ALL', label: '전체' },
    { key: 'COMMON', label: '공통' },
    { key: 'WEB', label: 'Web' },
    { key: 'ANDROID', label: 'Android' },
    { key: 'IOS', label: 'iOS' },
  ] as const;

  const statusOptions = [
    { key: 'ALL', label: '전체 상태' },
    { key: 'ONGOING', label: '진행중' },
    { key: 'UPCOMING', label: '예정' },
    { key: 'ENDED', label: '마감' },
  ] as const;

  const [selectedCategoryTab, setSelectedCategoryTab] =
    useState<EventCategoryFilter>('ALL');

  const [selectedStatus, setSelectedStatus] = useState<EventStatusFilter>('ALL');

  const filteredEvents = useMemo(
    () =>
      mockEventCards.filter((event) => {
        const categoryOk = selectedCategoryTab === 'ALL' || event.category === selectedCategoryTab;
        const statusOk = selectedStatus === 'ALL' || event.status === selectedStatus;
        return categoryOk && statusOk;
      }),
    [selectedCategoryTab, selectedStatus],
  );

  return (
    <>
      <div className="border-neutral-border-default flex h-17 items-center justify-between border-b">
        <CategoryTabs
          items={categoryTabsItems}
          value={selectedCategoryTab}
          onChange={setSelectedCategoryTab}
        />
        <Dropdown
          options={statusOptions}
          value={selectedStatus}
          setValue={setSelectedStatus}
          className="w-35"
        />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredEvents.map((item) => (
          <EventCard key={item.id} event={item} />
        ))}
      </div>
    </>
  );
}

export default EventList;
