import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import type { Event } from '@/types/event';
import Dropdown from '@/components/Dropdown';
import { getEvents } from '@/api/event';
import CategoryTabs from './CategoryTabs';
import EventCards from './EventCards';

type EventTrackFilter = 'ALL' | Event['track'];
type EventStatusFilter = 'ALL' | Event['status'];

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

function EventList() {
  const { orgId } = useParams<{ orgId: string }>();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    (async () => {
      setEvents(await getEvents(orgId));
    })();
  }, [orgId]);

  const [selectedCategoryTab, setSelectedCategoryTab] = useState<EventTrackFilter>('ALL');

  const [selectedStatus, setSelectedStatus] = useState<EventStatusFilter>('ALL');

  const handleDeleted = useCallback(() => {
    getEvents(orgId).then(setEvents);
  }, [orgId]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const categoryOk =
          selectedCategoryTab === 'ALL' ||
          event.track === selectedCategoryTab ||
          (selectedCategoryTab !== 'COMMON' && event.track === 'COMMON');
        const statusOk = selectedStatus === 'ALL' || event.status === selectedStatus;
        return categoryOk && statusOk;
      }),
    [events, selectedCategoryTab, selectedStatus],
  );

  return (
    <>
      <div className="border-neutral-border-default flex h-17 items-center justify-between gap-2 border-b">
        {/* 모바일: 드롭다운 */}
        <Dropdown
          options={categoryTabsItems}
          value={selectedCategoryTab}
          setValue={setSelectedCategoryTab}
          className="w-28 shrink-0 sm:hidden"
        />
        {/* 데스크톱: 탭 */}
        <div className="hidden sm:block">
          <CategoryTabs
            items={categoryTabsItems}
            value={selectedCategoryTab}
            onChange={setSelectedCategoryTab}
          />
        </div>
        <Dropdown
          options={statusOptions}
          value={selectedStatus}
          setValue={setSelectedStatus}
          className="w-35 shrink-0"
        />
      </div>
      <EventCards events={filteredEvents} onDeleted={handleDeleted} />
    </>
  );
}

export default EventList;
