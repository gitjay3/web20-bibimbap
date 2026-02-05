import ModifyIcon from '@/assets/icons/pencil.svg?react';
import RemoveIcon from '@/assets/icons/trash.svg?react';
import EventCategoryLabel from '@/components/EventCategoryLabel';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import type { Camper, Track } from '@/types/camper';
import RegistrationLabel from './RegistrationLabel';
import { useCamperEdit } from './hooks';

interface CamperCardProps {
  camper: Camper;
  onUpdate: (id: string, data: Partial<Omit<Camper, 'id' | 'status'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TRACK_OPTIONS: Track[] = ['WEB', 'IOS', 'ANDROID'];

function CamperCard({ camper, onUpdate, onDelete }: CamperCardProps) {
  const {
    isEditing,
    isSaving,
    isDeleting,
    isInvalid,
    editedData,
    setEditedData,
    handleEdit,
    handleCancel,
    handleSave,
    handleDelete,
  } = useCamperEdit({ camper, onUpdate, onDelete });

  if (isEditing) {
    return (
      <div className="border-neutral-border-default rounded-xl border bg-white p-4">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-neutral-text-secondary mb-1 block text-12">부스트캠프 ID</span>
              <TextInput
                value={editedData.camperId}
                onChange={(e) => setEditedData.setCamperId(e.target.value)}
                placeholder="J001"
              />
            </div>
            <div>
              <span className="text-neutral-text-secondary mb-1 block text-12">이름</span>
              <TextInput
                value={editedData.name}
                onChange={(e) => setEditedData.setName(e.target.value)}
                placeholder="이름"
              />
            </div>
          </div>
          <div>
            <span className="text-neutral-text-secondary mb-1 block text-12">GitHub ID</span>
            <TextInput
              value={editedData.username}
              onChange={(e) => setEditedData.setUsername(e.target.value)}
              placeholder="github-username"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-neutral-text-secondary mb-1 block text-12">분야</span>
              <select
                value={editedData.track}
                onChange={(e) => setEditedData.setTrack(e.target.value as Track)}
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
                value={editedData.groupNumber}
                onChange={(e) => setEditedData.setGroupNumber(e.target.value)}
                placeholder="1"
                type="number"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="secondary" variant="outline" onClickHandler={handleCancel} disabled={isSaving}>
              취소
            </Button>
            <Button onClickHandler={handleSave} disabled={isInvalid}>
              저장
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-neutral-border-default rounded-xl border bg-white p-4 ${isDeleting ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-neutral-text-primary text-16 font-semibold">{camper.name}</span>
            <span className="text-neutral-text-tertiary text-13">{camper.camperId}</span>
          </div>
          <p className="text-neutral-text-secondary text-14">@{camper.username}</p>
        </div>
        <div className="flex shrink-0 gap-3">
          <ModifyIcon
            className="h-5 w-5 cursor-pointer text-neutral-400 active:scale-95"
            onClick={handleEdit}
          />
          <RemoveIcon
            className="text-error-text-primary h-5 w-5 cursor-pointer active:scale-95"
            onClick={handleDelete}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EventCategoryLabel category={camper.track} />
          {camper.groupNumber && (
            <span className="text-neutral-text-secondary text-13">{camper.groupNumber}그룹</span>
          )}
        </div>
        <RegistrationLabel status={camper.status} />
      </div>
    </div>
  );
}

export default CamperCard;
