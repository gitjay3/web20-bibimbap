import PlusIcon from '@/assets/icons/plus.svg?react';
import Button from '@/components/Button';
import type { Camper } from '@/types/camper';
import CamperFormCells from './CamperFormCells';
import { useCamperAdd } from './hooks';

interface CamperAddRowProps {
  onAdd: (camper: Omit<Camper, 'id' | 'status'>) => void;
}

function CamperAddRow({ onAdd }: CamperAddRowProps) {
  const { isInvalid, formData, setFormData, handleAdd } = useCamperAdd({ onAdd });

  return (
    <tr className="border-neutral-border-default h-15 border-t">
      <CamperFormCells
        camperId={formData.camperId}
        setCamperId={setFormData.setCamperId}
        name={formData.name}
        setName={setFormData.setName}
        username={formData.username}
        setUsername={setFormData.setUsername}
        track={formData.track}
        setTrack={setFormData.setTrack}
        groupNumber={formData.groupNumber}
        setGroupNumber={setFormData.setGroupNumber}
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
