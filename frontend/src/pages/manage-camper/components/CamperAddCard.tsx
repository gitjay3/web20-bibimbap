import { useState } from 'react';
import PlusIcon from '@/assets/icons/plus.svg?react';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import type { Camper, Track } from '@/types/camper';
import { useCamperAdd } from './hooks';

interface CamperAddCardProps {
  onAdd: (camper: Omit<Camper, 'id' | 'status'>) => void;
}

const TRACK_OPTIONS: Track[] = ['WEB', 'IOS', 'ANDROID'];

function CamperAddCard({ onAdd }: CamperAddCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { isSubmitting, isInvalid, formData, setFormData, handleAdd, resetForm } = useCamperAdd({
    onAdd,
    onSuccess: () => setIsExpanded(false),
  });

  const handleCancel = () => {
    setIsExpanded(false);
    resetForm();
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="border-neutral-border-default hover:border-brand-border hover:bg-brand-50 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed bg-white py-4 transition"
      >
        <PlusIcon className="h-5 w-5 text-neutral-400" />
        <span className="text-neutral-text-secondary text-14 font-medium">캠퍼 추가</span>
      </button>
    );
  }

  return (
    <div className="border-neutral-border-default rounded-xl border bg-white p-4">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-neutral-text-secondary mb-1 block text-12">부스트캠프 ID</span>
            <TextInput
              value={formData.camperId}
              onChange={(e) => setFormData.setCamperId(e.target.value)}
              placeholder="J001"
            />
          </div>
          <div>
            <span className="text-neutral-text-secondary mb-1 block text-12">이름</span>
            <TextInput
              value={formData.name}
              onChange={(e) => setFormData.setName(e.target.value)}
              placeholder="이름"
            />
          </div>
        </div>
        <div>
          <span className="text-neutral-text-secondary mb-1 block text-12">GitHub ID</span>
          <TextInput
            value={formData.username}
            onChange={(e) => setFormData.setUsername(e.target.value)}
            placeholder="github-username"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-neutral-text-secondary mb-1 block text-12">분야</span>
            <select
              value={formData.track}
              onChange={(e) => setFormData.setTrack(e.target.value as Track)}
              className="border-neutral-border-default h-10 w-full rounded-lg border px-3 text-14"
            >
              {TRACK_OPTIONS.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-neutral-text-secondary mb-1 block text-12">그룹 번호</span>
            <TextInput
              value={formData.groupNumber}
              onChange={(e) => setFormData.setGroupNumber(e.target.value)}
              placeholder="1"
              type="number"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="secondary" variant="outline" onClickHandler={handleCancel} disabled={isSubmitting}>
            취소
          </Button>
          <Button disabled={isInvalid} onClickHandler={handleAdd}>
            <PlusIcon className="h-4 w-4" />
            추가
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CamperAddCard;
