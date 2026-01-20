import { useState } from 'react';
import PlusIcon from '@/assets/icons/plus.svg?react';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
import TextInput from '@/components/TextInput';
import type { Track } from '@/types/event';
import { trackOptions, type Camper } from '../../../types/camper';

interface CamperAddTableProps {
  onAdd: (camper: Camper) => void;
}

function CamperAddTable({ onAdd }: CamperAddTableProps) {
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newGithubId, setNewGithubId] = useState('');
  const [newTrack, setNewTrack] = useState<Track>('WEB');

  const isInvalid = !newId || !newName || !newGithubId;

  const handleAdd = () => {
    if (isInvalid) return;
    onAdd({ id: newId, name: newName, githubId: newGithubId, track: newTrack });
    setNewId('');
    setNewName('');
    setNewGithubId('');
    setNewTrack('WEB');
  };

  return (
    <div className="w-full">
      <table className="w-full table-fixed text-left">
        <tbody className="bg-white">
          <tr className="border-neutral-border-default border-t">
            <td className="px-6 py-4">
              <TextInput
                aria-label="부스트캠프 ID"
                placeholder="부스트캠프 ID"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
              />
            </td>
            <td className="px-6 py-4">
              <TextInput
                aria-label="이름"
                placeholder="이름"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </td>
            <td className="px-6 py-4">
              <TextInput
                aria-label="GitHub ID"
                placeholder="GitHub ID"
                value={newGithubId}
                onChange={(e) => setNewGithubId(e.target.value)}
              />
            </td>
            <td className="px-6 py-4">
              <Dropdown
                options={trackOptions}
                value={newTrack}
                setValue={setNewTrack}
                className="w-full"
              />
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end">
                <div className="w-20">
                  <Button onClickHandler={handleAdd} disabled={isInvalid}>
                    <PlusIcon className="h-4 w-4" />
                    추가
                  </Button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CamperAddTable;
