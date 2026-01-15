import ApplicationUnitLabel from '@/components/ApplicationUnitLabel';
import EventCategoryLabel from '@/components/EventCategoryLabel';
import EventStatusLabel from '@/components/EventStatusLabel';
import type { Event } from '@/types/event';
import formatKoreanDateTime from '@/utils/formatKoreanDateTime';
import CalendarIcon from '@/assets/icons/calendar-clock.svg?react';
import { Link } from 'react-router';
import Card from '@/components/Card';

interface EventCardProps {
  event: Event;
}

function EventCard({ event }: EventCardProps) {
  const { id, track, status, title, description, startTime, endTime, applicationUnit } = event;

  return (
    <Card>
      <Link to={`/events/${id}`} className='flex flex-col justify-between h-full'>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <ApplicationUnitLabel applicationUnit={applicationUnit} />
            <EventCategoryLabel category={track} />
            <EventStatusLabel status={status} />
          </div>
          <div className="text-20 font-extrabold">{title}</div>
          <div className="text-12 text-neutral-text-secondary">{description}</div>
        </div>
        <div className="bg-neutral-surface-default text-12 text-neutral-text-secondary flex h-8 items-center gap-2 rounded-md px-3">
          <CalendarIcon className="text-brand-text-primary h-4 w-4" />
          {`${formatKoreanDateTime(startTime)} ~ ${formatKoreanDateTime(endTime)}`}
        </div>
      </Link>
    </Card>
  );
}

export default EventCard;
