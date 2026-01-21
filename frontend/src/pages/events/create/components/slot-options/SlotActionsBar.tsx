import PlusIcon from '@/assets/icons/plus.svg?react';
import UploadIcon from '@/assets/icons/upload.svg?react';
import TemplateIcon from '@/assets/icons/template.svg?react';
import DownloadIcon from '@/assets/icons/download.svg?react';

type Props = {
  onOpenTemplate: () => void;
  onDownloadTemplate: () => void;
  onAddSlot: () => void;
};

export default function SlotActionsBar({ onOpenTemplate, onDownloadTemplate, onAddSlot }: Props) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onOpenTemplate}
        className="border-neutral-border-default text-14 flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 font-medium"
      >
        <TemplateIcon className="h-4 w-4" /> 템플릿 설정
      </button>

      <button
        type="button"
        onClick={onDownloadTemplate}
        className="border-neutral-border-default text-14 flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 font-medium"
      >
        <DownloadIcon className="h-4 w-4" /> 서식 다운로드
      </button>

      <button
        type="button"
        className="border-neutral-border-default text-14 flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 font-medium"
      >
        <UploadIcon className="h-4 w-4" /> 엑셀 업로드
      </button>

      <button
        type="button"
        onClick={onAddSlot}
        className="bg-brand-surface-default text-14 flex items-center gap-1.5 rounded-md px-4 py-2 font-medium text-white"
      >
        <PlusIcon className="h-4 w-4" /> 선택지 추가
      </button>
    </div>
  );
}
