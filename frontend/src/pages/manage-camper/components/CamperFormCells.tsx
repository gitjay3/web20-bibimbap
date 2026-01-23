import TextInput from '@/components/TextInput';
import Dropdown from '@/components/Dropdown';
import { trackOptions } from '@/types/camper';
import type { Track } from '@/types/camper';

interface CamperFormCellsProps {
  camperId: string;
  setCamperId: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  track: Track;
  setTrack: (value: Track) => void;
  groupNumber: string;
  setGroupNumber: (value: string) => void;
}

function CamperFormCells({
  camperId,
  setCamperId,
  name,
  setName,
  username,
  setUsername,
  track,
  setTrack,
  groupNumber,
  setGroupNumber,
}: CamperFormCellsProps) {
  return (
    <>
      <td className="px-6">
        <TextInput
          placeholder="부스트캠프 ID"
          aria-label="부스트캠프 ID"
          value={camperId}
          onChange={(e) => setCamperId(e.target.value)}
        />
      </td>
      <td className="px-6">
        <TextInput
          placeholder="이름"
          aria-label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </td>
      <td className="px-6">
        <TextInput
          placeholder="GitHub ID"
          aria-label="GitHub ID"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </td>
      <td className="px-6">
        <Dropdown options={trackOptions} value={track} setValue={setTrack} className="w-full" />
      </td>
      <td className="px-6">
        <TextInput
          placeholder="그룹 번호"
          aria-label="그룹 번호"
          value={groupNumber}
          onChange={(e) => setGroupNumber(e.target.value)}
          type="number"
        />
      </td>
    </>
  );
}

export default CamperFormCells;
