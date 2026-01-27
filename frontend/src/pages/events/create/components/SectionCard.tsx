import type { ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  description: ReactNode;
  children: ReactNode;
};

export default function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <div className="border-neutral-border-default flex flex-col gap-6 rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-20 font-bold">{title}</div>
          <div className="text-neutral-text-secondary text-16">{description}</div>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
