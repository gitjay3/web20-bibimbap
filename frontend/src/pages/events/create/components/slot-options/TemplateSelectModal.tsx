import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import useOutsideClick from '@/hooks/useOutsideClick';

export type SlotFieldType = 'text' | 'number' | 'time';

export type Template = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  fields: Array<{ id: string; name: string; type: SlotFieldType }>;
};

type Props = {
  open: boolean;
  templates: Template[];
  manageTemplatesHref: string;
  onClose: () => void;
  onSelect: (template: Template) => void;
};

export default function TemplateSelectModal({
  open,
  templates,
  manageTemplatesHref,
  onClose,
  onSelect,
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  useOutsideClick(modalRef, onClose);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (open) {
      window.addEventListener('keydown', onKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div ref={modalRef} className="w-full max-w-160 rounded-xl bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 px-6 pt-6">
          <div className="flex flex-col gap-2">
            <div className="text-20 text-neutral-text-primary font-bold">템플릿 선택</div>
            <div className="text-16 text-neutral-text-tertiary leading-relaxed">
              이벤트에 필요한 입력 항목(필드) 구성을 선택하세요.
              <br />
              선택 시 기존 입력된 옵션 데이터는 초기화됩니다.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-text-tertiary hover:text-neutral-text-primary rounded-md p-1"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="px-6 pt-5 pb-4">
          <div className="space-y-3">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t)}
                className="border-neutral-border-default hover:bg-neutral-surface-default flex w-full items-center justify-between gap-4 rounded-lg border px-5 py-4 text-left transition"
              >
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="text-16 text-neutral-text-primary font-semibold">{t.title}</div>
                  <div className="text-13 text-neutral-text-tertiary">{t.description}</div>

                  <div className="flex flex-wrap gap-1.5">
                    {t.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-neutral-border-default/70 text-14 text-neutral-text-tertiary rounded-full px-2 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end py-4">
            <Link
              to={manageTemplatesHref}
              onClick={onClose}
              className="text-16 text-brand-text-primary font-medium hover:underline"
            >
              템플릿 관리 페이지로 이동 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
