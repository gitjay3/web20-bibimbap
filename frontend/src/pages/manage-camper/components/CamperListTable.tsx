import type { Camper } from '@/types/camper';
import CamperAddRow from './CamperAddRow';
import CamperRow from './CamperRow';
import CamperCard from './CamperCard';
import CamperAddCard from './CamperAddCard';

interface CamperListTableProps {
  campers: Camper[];
  onAdd: (camper: Omit<Camper, 'id' | 'status'>) => void;
  onUpdate: (id: string, data: Partial<Omit<Camper, 'id' | 'status'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function CamperListTable({ campers, onAdd, onUpdate, onDelete }: CamperListTableProps) {
  return (
    <>
      {/* 모바일: 카드 레이아웃 */}
      <div className="flex flex-col gap-3 sm:hidden">
        {campers.map((camper) => (
          <CamperCard
            key={camper.id}
            camper={camper}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
        <CamperAddCard onAdd={onAdd} />
      </div>

      {/* 데스크톱: 테이블 레이아웃 */}
      <div className="hidden w-full sm:block">
        <table className="w-full table-fixed text-left">
          <thead className="bg-surface-white border-neutral-border-default border-b">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">
                부스트캠프 ID
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                이름
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                GitHub ID
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                분야
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                그룹 번호
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                가입 여부
              </th>
              <th scope="col" className="px-6 py-3 text-right font-medium">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-neutral-border-default text-neutral-text-secondary divide-y bg-white">
            {campers.map((camper) => (
              <CamperRow
                key={camper.id}
                camper={camper}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
            <CamperAddRow onAdd={onAdd} />
          </tbody>
        </table>
      </div>
    </>
  );
}

export default CamperListTable;
