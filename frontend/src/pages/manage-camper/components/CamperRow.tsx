import ModifyIcon from '@/assets/icons/pencil.svg?react';
import RemoveIcon from '@/assets/icons/trash.svg?react';
import EventCategoryLabel from '@/components/EventCategoryLabel';
import Button from '@/components/Button';
import type { Camper } from '@/types/camper';
import RegistrationLabel from './RegistrationLabel';
import CamperFormCells from './CamperFormCells';
import { useCamperEdit } from './hooks';

interface CamperRowProps {
  camper: Camper;
  onUpdate: (id: string, data: Partial<Omit<Camper, 'id' | 'status'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function CamperRow({ camper, onUpdate, onDelete }: CamperRowProps) {
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
      <tr className="border-neutral-border-default h-15 border-t">
        <CamperFormCells
          camperId={editedData.camperId}
          setCamperId={setEditedData.setCamperId}
          name={editedData.name}
          setName={setEditedData.setName}
          username={editedData.username}
          setUsername={setEditedData.setUsername}
          track={editedData.track}
          setTrack={setEditedData.setTrack}
          groupNumber={editedData.groupNumber}
          setGroupNumber={setEditedData.setGroupNumber}
        />
        <td className="px-6">
          <div className="flex h-10 items-center">
            <RegistrationLabel status={camper.status} />
          </div>
        </td>
        <td className="px-6 text-right">
          <div className="flex items-center justify-end gap-2">
            <div className="w-16">
              <Button type="secondary" onClickHandler={handleCancel} variant="outline" disabled={isSaving}>
                취소
              </Button>
            </div>
            <div className="w-16">
              <Button onClickHandler={handleSave} disabled={isInvalid}>
                저장
              </Button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr key={camper.id} className="h-15">
      <td className="px-6 font-medium whitespace-nowrap">
        <div className="flex h-10 items-center">{camper.camperId}</div>
      </td>
      <td className="px-6">
        <div className="flex h-10 items-center">{camper.name}</div>
      </td>
      <td className="px-6">
        <div className="flex h-10 items-center">{camper.username}</div>
      </td>
      <td className="px-6">
        <div className="flex h-10 items-center">
          <EventCategoryLabel category={camper.track} />
        </div>
      </td>
      <td className="px-6">
        <div className="flex h-10 items-center">{camper.groupNumber}</div>
      </td>
      <td className="px-6">
        <div className="flex h-10 items-center">
          <RegistrationLabel status={camper.status} />
        </div>
      </td>
      <td className="px-6 text-right">
        <div className={`flex h-10 items-center justify-end gap-4 ${isDeleting ? 'pointer-events-none opacity-50' : ''}`}>
          <ModifyIcon className="h-4 w-4 cursor-pointer" onClick={handleEdit} />
          <RemoveIcon
            className="text-error-text-primary h-4 w-4 cursor-pointer"
            onClick={handleDelete}
          />
        </div>
      </td>
    </tr>
  );
}

export default CamperRow;
