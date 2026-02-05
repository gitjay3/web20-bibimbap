import type { ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  description: ReactNode;
  children: ReactNode;
};

export default function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <div className="border-neutral-border-default flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:gap-6 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-18 font-bold sm:text-20">{title}</div>
          <div className="text-neutral-text-secondary text-14 sm:text-16">{description}</div>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
