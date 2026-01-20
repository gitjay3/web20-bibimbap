import ModifyIcon from '@/assets/icons/pencil.svg?react';
import RemoveIcon from '@/assets/icons/trash.svg?react';
import EventCategoryLabel from '@/components/EventCategoryLabel';
import type { Camper } from '../../../types/camper';

interface CamperListTableProps {
  campers: Camper[];
}

function CamperListTable({ campers }: CamperListTableProps) {
  return (
    <div className="w-full">
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
            <th scope="col" className="px-6 py-3 text-right font-medium">
              관리
            </th>
          </tr>
        </thead>
        <tbody className="divide-neutral-border-default text-neutral-text-secondary divide-y bg-white">
          {campers.map((camper) => (
            <tr key={camper.id}>
              <td className="px-6 py-4 font-medium whitespace-nowrap">{camper.id}</td>
              <td className="px-6 py-4">{camper.name}</td>
              <td className="px-6 py-4">{camper.githubId}</td>
              <td className="px-6 py-4">
                <div className="flex">
                  <EventCategoryLabel category={camper.track} />
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-4">
                  <ModifyIcon className="h-4 w-4" />
                  <RemoveIcon className="text-error-text-primary h-4 w-4" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CamperListTable;
