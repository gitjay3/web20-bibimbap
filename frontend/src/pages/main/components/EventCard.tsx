import { useNavigate } from 'react-router';
import EventCategoryLabel from '@/components/EventCategoryLabel';
import EventStatusLabel from '@/components/EventStatusLabel';
import type { Event } from '@/types/event';
import formatKoreanDateTime from '@/utils/formatKoreanDateTime';

function EventCard({ id, category, status, title, description, startAt, endAt }: Event) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/events/${id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="border-neutral-border-default hover:border-brand-border-default flex h-62.5 w-full flex-col justify-between rounded-xl border p-5 text-left transition hover:shadow-md">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <EventCategoryLabel category={category} />
          <EventStatusLabel status={status} />
        </div>
        <div className="text-20 font-extrabold">{title}</div>
        <div className="text-12 text-neutral-text-secondary">{description}</div>
      </div>
      <div className="bg-neutral-surface-default text-12 text-neutral-text-secondary flex h-8 items-center gap-2 rounded-md px-3">{`${formatKoreanDateTime(startAt)} ~ ${formatKoreanDateTime(endAt)}`}</div>
    </button>
  );
}

export default EventCard;
