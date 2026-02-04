import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  meta?: ReactNode;
  action?: ReactNode;
}

function PageHeader({ title, description, meta, action }: PageHeaderProps) {
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-24 font-extrabold sm:text-36">{title}</h1>
          {meta && meta}
        </div>
        <h2 className="text-neutral-text-secondary text-14 sm:text-16">{description}</h2>
      </div>
      {action && <div className="flex flex-wrap gap-2 self-end sm:self-auto">{action}</div>}
    </div>
  );
}

export default PageHeader;
