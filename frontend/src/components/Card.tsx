import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
}

function Card({ children }: CardProps) {
  return (
    <div className="border-neutral-border-default hover:border-brand-border-default flex h-62.5 w-full cursor-pointer flex-col justify-between rounded-xl border p-5 text-left transition hover:shadow-md">
      {children}
    </div>
  );
}

export default Card;
