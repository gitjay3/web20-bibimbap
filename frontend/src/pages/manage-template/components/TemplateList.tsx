import type { Template } from '@/types/template';
import TemplateCard from './TemplateCard';

interface TemplateListProps {
  templates: Template[];
  onEdit: (template: Template) => void;
  onDelete: (id: number) => void;
  onClick: (template: Template) => void;
}

function TemplateList({ templates, onEdit, onDelete, onClick }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="text-neutral-text-tertiary flex h-40 items-center justify-center">
        등록된 템플릿이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {templates.map((item) => (
        <TemplateCard
          key={item.id}
          template={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onClick={onClick}
        />
      ))}
    </div>
  );
}

export default TemplateList;
