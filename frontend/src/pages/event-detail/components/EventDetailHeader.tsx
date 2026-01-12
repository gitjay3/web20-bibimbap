import ApplicationUnitLabel from '@/components/ApplicationUnitLabel';
import EventCategoryLabel from '@/components/EventCategoryLabel';
import EventStatusLabel from '@/components/EventStatusLabel';
import type { ApplicationUnit, EventCategory, EventStatus } from '@/types/event';

interface EventDetailHeaderProps {
  category: EventCategory;
  status: EventStatus;
  title: string;
  description: string;
  applicationUnit: ApplicationUnit;
}

function EventDetailHeader({ category, status, title, description, applicationUnit }: EventDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ApplicationUnitLabel applicationUnit={applicationUnit} />
        <EventCategoryLabel category={category} />
        <EventStatusLabel status={status} />
      </div>
      <h1 className="text-24 font-extrabold">{title}</h1>
      <p className="text-16 text-neutral-text-secondary">{description}</p>
    </div>
  );
}

export default EventDetailHeader;
