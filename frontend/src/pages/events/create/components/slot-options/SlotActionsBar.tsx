import { useRef } from 'react';
import PlusIcon from '@/assets/icons/plus.svg?react';
import UploadIcon from '@/assets/icons/upload.svg?react';
import TemplateIcon from '@/assets/icons/template.svg?react';

type Props = {
  onOpenTemplate: () => void;
  onAddSlot: () => void;
  onUploadExcel: (file: File) => void;
};

export default function SlotActionsBar({ onOpenTemplate, onAddSlot, onUploadExcel }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadExcel(file);
      e.target.value = ''; // 같은 파일을 다시 올릴 수 있도록 초기화
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onOpenTemplate}
        className="border-neutral-border-default flex items-center gap-1.5 rounded-md border bg-white px-2 py-1.5 text-13 font-medium sm:px-3 sm:py-2 sm:text-14"
      >
        <TemplateIcon className="h-4 w-4" />
        <span className="hidden sm:inline">템플릿 설정</span>
        <span className="sm:hidden">템플릿</span>
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />

      <button
        type="button"
        onClick={handleUploadClick}
        className="border-neutral-border-default flex items-center gap-1.5 rounded-md border bg-white px-2 py-1.5 text-13 font-medium sm:px-3 sm:py-2 sm:text-14"
      >
        <UploadIcon className="h-4 w-4" />
        <span className="hidden sm:inline">엑셀 업로드</span>
        <span className="sm:hidden">업로드</span>
      </button>

      <button
        type="button"
        onClick={onAddSlot}
        className="bg-brand-surface-default flex items-center gap-1.5 rounded-md px-3 py-1.5 text-13 font-medium text-white sm:px-4 sm:py-2 sm:text-14"
      >
        <PlusIcon className="h-4 w-4" />
        <span className="hidden sm:inline">선택지 추가</span>
        <span className="sm:hidden">추가</span>
      </button>
    </div>
  );
}
