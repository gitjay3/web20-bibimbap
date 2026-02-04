import { useState } from 'react';
import type { Camper, Track } from '@/types/camper';

interface UseCamperAddParams {
  onAdd: (camper: Omit<Camper, 'id' | 'status'>) => void;
  onSuccess?: () => void;
}

export default function useCamperAdd({ onAdd, onSuccess }: UseCamperAddParams) {
  const [newCamperId, setNewCamperId] = useState('');
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newTrack, setNewTrack] = useState<Track>('WEB');
  const [newGroupNumber, setNewGroupNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isInvalid = !newCamperId || !newName || !newUsername || isSubmitting;

  const resetForm = () => {
    setNewCamperId('');
    setNewName('');
    setNewUsername('');
    setNewTrack('WEB');
    setNewGroupNumber('');
  };

  const handleAdd = async () => {
    if (isInvalid) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        camperId: newCamperId,
        name: newName,
        username: newUsername,
        track: newTrack,
        groupNumber: newGroupNumber ? parseInt(newGroupNumber, 10) : null,
      });
      resetForm();
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    isInvalid,
    formData: {
      camperId: newCamperId,
      name: newName,
      username: newUsername,
      track: newTrack,
      groupNumber: newGroupNumber,
    },
    setFormData: {
      setCamperId: setNewCamperId,
      setName: setNewName,
      setUsername: setNewUsername,
      setTrack: setNewTrack,
      setGroupNumber: setNewGroupNumber,
    },
    handleAdd,
    resetForm,
  };
}
