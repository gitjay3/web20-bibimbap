import { useRef, useState } from 'react';
import Card from '@/components/Card';
import type { Template } from '@/types/template';
import useOutsideClick from '@/hooks/useOutsideClick';
import KebabMenuIcon from '@/assets/icons/ellipsis-vertical.svg?react';
import PencilIcon from '@/assets/icons/pencil.svg?react';
import TrashIcon from '@/assets/icons/trash.svg?react';

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (id: number) => void;
  onClick: (template: Template) => void;
}

const MAX_VISIBLE_FIELDS = 3;

function TemplateCard({ template, onEdit, onDelete, onClick }: TemplateCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(menuRef, () => setIsMenuOpen(false));

  const { fields } = template.slotSchema;
  const hasMoreFields = fields.length > MAX_VISIBLE_FIELDS;
  const visibleFields = fields.slice(0, MAX_VISIBLE_FIELDS);

  const handleEdit = () => {
    setIsMenuOpen(false);
    onEdit(template);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete(template.id);
  };

  return (
    <Card>
      <div className="flex justify-between">
        <div className="text-20 font-bold">{template.title}</div>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            className="cursor-pointer"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <KebabMenuIcon className="text-neutral-text-secondary h-4 w-4" />
          </button>
          {isMenuOpen && (
            <div className="border-neutral-border-default absolute right-0 top-6 z-10 w-24 rounded-lg border bg-white py-1 shadow-md">
              <button
                type="button"
                className="text-neutral-text-secondary flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-14 hover:bg-gray-50"
                onClick={handleEdit}
              >
                <PencilIcon className="h-4 w-4" />
                수정
              </button>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-14 text-red-500 hover:bg-gray-50"
                onClick={handleDelete}
              >
                <TrashIcon className="h-4 w-4" />
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="bg-neutral-surface-default flex flex-col gap-3 overflow-hidden rounded-md p-3">
        <div className="text-neutral-text-tertiary flex justify-between text-12">
          <div>FIELD NAME</div>
          <div>TYPE</div>
        </div>
        {visibleFields.map((field, idx) => (
          <div key={`${field.name}-${field.type}-${idx}`} className="flex flex-col gap-1.5">
            <div className="text-12 flex justify-between">
              <div className="text-neutral-text-secondary truncate pr-2">{field.name}</div>
              <div className="text-neutral-text-tertiary border-neutral-border-default h-5 shrink-0 rounded-md border bg-white px-2">
                {field.type}
              </div>
            </div>
            {idx < visibleFields.length - 1 && (
              <hr className="border-neutral-border-default" />
            )}
          </div>
        ))}
        {hasMoreFields && (
          <button
            type="button"
            className="text-neutral-text-tertiary w-full cursor-pointer text-center text-12 hover:text-neutral-text-secondary hover:underline"
            onClick={() => onClick(template)}
          >
            외 {fields.length - MAX_VISIBLE_FIELDS}개
          </button>
        )}
      </div>
    </Card>
  );
}

export default TemplateCard;
