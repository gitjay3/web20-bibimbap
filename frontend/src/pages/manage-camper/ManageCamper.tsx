import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import PlusIcon from '@/assets/icons/plus.svg?react';
import DownloadIcon from '@/assets/icons/download.svg?react';
import type { Camper } from '@/types/camper';
import CamperListTable from './components/CamperListTable';
import CamperAddTable from './components/CamperAddTable';

// Initial mock data
const INITIAL_CAMPERS: Camper[] = [
  { id: 'J001', name: '김철수', githubId: 'kim-chul', track: 'WEB' },
  { id: 'J002', name: '이영희', githubId: 'lee-young', track: 'ANDROID' },
  { id: 'J283', name: '한지은', githubId: 'hanpengbutt', track: 'IOS' },
];

function ManageCamper() {
  const [campers, setCampers] = useState<Camper[]>(INITIAL_CAMPERS);

  const handleAddCamper = (newCamper: Camper) => {
    setCampers((prev) => [...prev, newCamper]);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="캠퍼 관리"
        description="현재 선택된 과정의 캠퍼 목록을 관리합니다."
        action={
          <div className="flex gap-2">
            <Button type="secondary" variant="outline">
              <DownloadIcon className="h-4 w-4" />
              캠퍼 정보 다운로드
            </Button>
            <Button type="secondary">
              <PlusIcon className="h-4 w-4" />
              캠퍼 정보 업로드
            </Button>
          </div>
        }
      />
      <div className="flex flex-col">
        <CamperListTable campers={campers} />
        <CamperAddTable onAdd={handleAddCamper} />
      </div>
    </div>
  );
}

export default ManageCamper;
