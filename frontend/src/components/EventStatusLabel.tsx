import type { Status } from '@/types/event';
import cn from '@/utils/cn';

interface EventStatusLabelProps {
  status: Status;
}

const STATUS_LABEL_TEXT: Record<Status, string> = {
  ONGOING: '진행중',
  UPCOMING: '예정',
  ENDED: '종료',
};

function EventStatusLabel({ status }: EventStatusLabelProps) {
  return (
    <span
      className={cn(
        'text-12 flex h-5 items-center rounded-sm px-2 font-bold',
        status === 'ONGOING'
          ? 'bg-brand-surface-default text-white'
          : 'bg-neutral-surface-default text-neutral-text-secondary border-neutral-border-default border',
      )}
    >
      {STATUS_LABEL_TEXT[status]}
    </span>
  );
}

export default EventStatusLabel;
