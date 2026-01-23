import type { ReactNode } from 'react';
import cn from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

function Card({ children, className, onClick }: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const baseClassName = cn(
    'border-neutral-border-default hover:border-brand-border-default relative flex h-62.5 w-full flex-col justify-between rounded-xl border p-5 text-left transition hover:shadow-md',
    onClick && 'cursor-pointer',
    className,
  );

  if (onClick) {
    return (
      <div
        className={baseClassName}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>
    );
  }

  return <div className={baseClassName}>{children}</div>;
}

export default Card;
