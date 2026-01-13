import type { EventSession } from '@/types/event';
import cn from '@/utils/cn';

interface SessionCardProps {
  session: EventSession;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function getCardBorderClass(isClosed: boolean, isSelected: boolean): string {
  if (isClosed) {
    return 'border-neutral-border-default cursor-not-allowed bg-gray-50';
  }
  if (isSelected) {
    return 'border-brand-500';
  }
  return 'border-neutral-border-default hover:border-brand-200';
}

function getContentTextClass(isSelected: boolean): string {
  if (isSelected) {
    return 'text-brand-500';
  }
  return 'text-neutral-text-primary';
}

function SessionCard({ session, isSelected, onSelect }: SessionCardProps) {
  const { id, content, startTime, endTime, location, currentCount, maxCount, isClosed } = session;

  const handleClick = () => {
    if (!isClosed) {
      onSelect(id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isClosed}
      className={cn(
        'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition',
        getCardBorderClass(isClosed, isSelected)
      )}
    >
      <div className="flex items-center gap-4">
        <span className={cn('text-16 font-medium', getContentTextClass(isSelected))}>
          {content}
        </span>
        <span className="text-neutral-text-tertiary">|</span>
        <span className="text-16 text-neutral-text-secondary">
          {startTime} - {endTime}
        </span>
        <span className="text-neutral-text-tertiary">|</span>
        <span className="text-16 text-neutral-text-secondary">{location}</span>
      </div>
      <span
        className={cn(
          'text-16',
          isClosed
            ? 'text-error-text-primary font-medium'
            : 'text-neutral-text-secondary font-medium'
        )}
      >
        {isClosed ? '마감' : `${currentCount}/${maxCount}`}
      </span>
    </button>
  );
}

export default SessionCard;
