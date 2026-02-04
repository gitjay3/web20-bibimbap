import { memo } from 'react';
import type { Event } from '@/types/event';
import EventCard from './EventCard';

interface EventCardsProps {
  events: Event[];
  onDeleted: () => void;
}

function EventCards({ events, onDeleted }: EventCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {events.map((item) => (
        <EventCard
          key={item.id}
          event={item}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  );
}

export default memo(EventCards);
