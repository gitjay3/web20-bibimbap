import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import type { EventDetail, EventDetail as EventDetailType } from '@/types/event';
import EventDetailHeader from './components/EventDetailHeader';
import ReservationButton from './components/ReservationButton';
import { getEvent } from '@/api/event';
import SlotList from './components/SlotList';

function EventDetail() {
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<EventDetailType | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setEvent(await getEvent(Number(id)));
    })();
  }, []);

  if (!event) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-neutral-text-secondary">이벤트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="w-160">
        <div className="flex flex-col gap-6">
          <EventDetailHeader
            category={event.track}
            status={event.stauts}
            title={event.title}
            description={event.description}
            applicationUnit={event.applicationUnit}
          />
          <hr className="border-neutral-border-default" />
          <SlotList
            status={event.stauts}
            slotSchema={event.slotSchema}
            slots={event.EventSlot}
            selectedSlotId={selectedSlotId}
            setSelectedSlotId={setSelectedSlotId}
          />
        </div>
      </div>
      <ReservationButton
        isReservable={event.stauts === 'ONGOING'}
        selectedSlotId={selectedSlotId}
      />
    </div>
  );
}

export default EventDetail;
