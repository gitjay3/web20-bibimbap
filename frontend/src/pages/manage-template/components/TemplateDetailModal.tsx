import Modal from '@/components/Modal';
import type { Template } from '@/types/template';

interface TemplateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

function TemplateDetailModal({ isOpen, onClose, template }: TemplateDetailModalProps) {
  if (!template) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-6 pt-4">
        <div>
          <h2 className="text-20 font-bold">{template.title}</h2>
          {template.description && (
            <p className="text-neutral-text-secondary mt-1 text-14">{template.description}</p>
          )}
        </div>

        <div className="bg-neutral-surface-default flex max-h-80 flex-col gap-3 overflow-y-auto rounded-md p-3">
          <div className="text-neutral-text-tertiary flex justify-between text-12">
            <div>FIELD NAME</div>
            <div>TYPE</div>
          </div>
          {template.slotSchema.fields.map((field, idx) => (
            <div key={`${field.name}-${field.type}-${idx}`} className="flex flex-col gap-1.5">
              <div className="text-12 flex justify-between">
                <div className="text-neutral-text-secondary">{field.name}</div>
                <div className="text-neutral-text-tertiary border-neutral-border-default h-5 shrink-0 rounded-md border bg-white px-2">
                  {field.type}
                </div>
              </div>
              {idx < template.slotSchema.fields.length - 1 && (
                <hr className="border-neutral-border-default" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default TemplateDetailModal;
