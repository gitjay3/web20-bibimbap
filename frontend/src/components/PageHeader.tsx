import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  meta?: ReactNode;
  action?: ReactNode;
}

function PageHeader({ title, description, meta, action }: PageHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-36 font-extrabold">{title}</h1>
          {meta && meta}
        </div>
        <h2 className="text-neutral-text-secondary">{description}</h2>
      </div>
      {action}
    </div>
  );
}

export default PageHeader;
