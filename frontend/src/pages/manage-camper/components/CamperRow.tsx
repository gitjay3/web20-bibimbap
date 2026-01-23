import { useState } from 'react';
import ModifyIcon from '@/assets/icons/pencil.svg?react';
import RemoveIcon from '@/assets/icons/trash.svg?react';
import EventCategoryLabel from '@/components/EventCategoryLabel';
import Button from '@/components/Button';
import type { Camper, Track } from '@/types/camper';
import RegistrationLabel from './RegistrationLabel';
import CamperFormCells from './CamperFormCells';

interface CamperRowProps {
  camper: Camper;
  onUpdate: (id: string, data: Partial<Omit<Camper, 'id' | 'status'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function CamperRow({ camper, onUpdate, onDelete }: CamperRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedCamperId, setEditedCamperId] = useState(camper.camperId);
  const [editedName, setEditedName] = useState(camper.name);
  const [editedUsername, setEditedUsername] = useState(camper.username);
  const [editedTrack, setEditedTrack] = useState<Track>(camper.track as Track);
  const [editedGroupNumber, setEditedGroupNumber] = useState(camper.groupNumber?.toString() || '');

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    setEditedCamperId(camper.camperId);
    setEditedName(camper.name);
    setEditedUsername(camper.username);
    setEditedTrack(camper.track as Track);
    setEditedGroupNumber(camper.groupNumber?.toString() || '');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(camper.id, {
        camperId: editedCamperId,
        name: editedName,
        username: editedUsername,
        track: editedTrack,
        groupNumber: editedGroupNumber ? parseInt(editedGroupNumber, 10) : null,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update camper:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`${camper.name} 캠퍼를 삭제하시겠습니까?`)) return;

    setIsDeleting(true);
    try {
      await onDelete(camper.id);
    } catch (error) {
      console.error('Failed to delete camper:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isInvalid = !editedCamperId || !editedName || !editedUsername || isSaving;

  if (isEditing) {
    return (
      <tr className="border-neutral-border-default h-15 border-t">
        <CamperFormCells
          camperId={editedCamperId}
          setCamperId={setEditedCamperId}
          name={editedName}
          setName={setEditedName}
          username={editedUsername}
          setUsername={setEditedUsername}
          track={editedTrack}
          setTrack={setEditedTrack}
          groupNumber={editedGroupNumber}
          setGroupNumber={setEditedGroupNumber}
        />
        <td className="px-6">
          <div className="flex h-10 items-center">
            <RegistrationLabel status={camper.status} />
          </div>
        </td>
        <td className="px-6 text-right">
          <div className="flex justify-end gap-2 items-center">
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
        <div className={`flex h-10 items-center justify-end gap-4 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
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
