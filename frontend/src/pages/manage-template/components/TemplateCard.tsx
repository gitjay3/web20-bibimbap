import Card from '@/components/Card';
import type { Template } from '@/types/template';
import KebabMenuIcon from '@/assets/icons/ellipsis-vertical.svg?react';

interface TemplateCardProps {
  template: Template;
}

function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Card>
      <div className="flex justify-between">
        <div className="text-20 font-bold">{template.title}</div>
        <KebabMenuIcon className="text-neutral-text-secondary h-4 w-4" />
      </div>
      <div className="bg-neutral-surface-default flex flex-col gap-3 rounded-md p-3">
        <div className="text-neutral-text-tertiary flex justify-between">
          <div>FIELD NAME</div>
          <div>TYPE</div>
        </div>
        {template.slotSchema.map((field, idx) => (
          <div className="flex flex-col gap-1.5">
            <div className="text-12 flex justify-between">
              <div className="text-neutral-text-secondary">{field.label}</div>
              <div className="text-neutral-text-tertiary border-neutral-border-default h-5 rounded-md border bg-white px-2">
                {field.type}
              </div>
            </div>
            {idx < template.slotSchema.length - 1 && <hr className='border-neutral-border-default' />}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default TemplateCard;
