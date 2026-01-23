import { useState } from 'react';
import PlusIcon from '@/assets/icons/plus.svg?react';
import Button from '@/components/Button';
import type { Camper, Track } from '@/types/camper';
import CamperFormCells from './CamperFormCells';

interface CamperAddRowProps {
  onAdd: (camper: Omit<Camper, 'id' | 'status'>) => void;
}

function CamperAddRow({ onAdd }: CamperAddRowProps) {
  const [newCamperId, setNewCamperId] = useState('');
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newTrack, setNewTrack] = useState<Track>('WEB');
  const [newGroupNumber, setNewGroupNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isInvalid = !newCamperId || !newName || !newUsername || isSubmitting;

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
      setNewCamperId('');
      setNewName('');
      setNewUsername('');
      setNewTrack('WEB');
      setNewGroupNumber('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <tr className="border-neutral-border-default h-15 border-t">
      <CamperFormCells
        camperId={newCamperId}
        setCamperId={setNewCamperId}
        name={newName}
        setName={setNewName}
        username={newUsername}
        setUsername={setNewUsername}
        track={newTrack}
        setTrack={setNewTrack}
        groupNumber={newGroupNumber}
        setGroupNumber={setNewGroupNumber}
      />
      <td className="px-6" aria-hidden="true" />
      <td className="px-6 text-right">
        <div className="flex h-10 items-center justify-end">
          <div className="w-20">
            <Button disabled={isInvalid} onClickHandler={handleAdd}>
              <PlusIcon className="h-4 w-4" />
              추가
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default CamperAddRow;
