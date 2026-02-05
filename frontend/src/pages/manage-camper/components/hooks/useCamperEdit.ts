import { useState } from 'react';
import type { Camper, Track } from '@/types/camper';

interface UseCamperEditParams {
  camper: Camper;
  onUpdate: (id: string, data: Partial<Omit<Camper, 'id' | 'status'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function useCamperEdit({ camper, onUpdate, onDelete }: UseCamperEditParams) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editedCamperId, setEditedCamperId] = useState(camper.camperId);
  const [editedName, setEditedName] = useState(camper.name);
  const [editedUsername, setEditedUsername] = useState(camper.username);
  const [editedTrack, setEditedTrack] = useState<Track>(camper.track as Track);
  const [editedGroupNumber, setEditedGroupNumber] = useState(camper.groupNumber?.toString() || '');

  const isInvalid = !editedCamperId || !editedName || !editedUsername || isSaving;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
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

  return {
    isEditing,
    isSaving,
    isDeleting,
    isInvalid,
    editedData: {
      camperId: editedCamperId,
      name: editedName,
      username: editedUsername,
      track: editedTrack,
      groupNumber: editedGroupNumber,
    },
    setEditedData: {
      setCamperId: setEditedCamperId,
      setName: setEditedName,
      setUsername: setEditedUsername,
      setTrack: setEditedTrack,
      setGroupNumber: setEditedGroupNumber,
    },
    handleEdit,
    handleCancel,
    handleSave,
    handleDelete,
  };
}
