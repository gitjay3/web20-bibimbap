import type { Organization } from '@/api/organization';
import OrganizationRow from './OrganizationRow';

interface OrganizationListTableProps {
  organizations: Organization[];
  onEdit: (organization: Organization) => void;
}

function OrganizationListTable({ organizations, onEdit }: OrganizationListTableProps) {
  return (
    <div className="mx-auto w-full overflow-hidden rounded-2xl border border-neutral-border-default bg-white">
      <table className="w-full table-fixed text-left">
        <thead className="bg-surface-white border-neutral-border-default border-b">
          <tr>
            <th scope="col" className="w-120 px-6 py-3 font-medium">
              조직명
            </th>
            <th scope="col" className="w-40 px-6 py-3 font-medium">
              캠퍼 수
            </th>
            <th scope="col" className="w-40 px-6 py-3 font-medium">
              이벤트 수
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              관리
            </th>
          </tr>
        </thead>
        <tbody className="divide-neutral-border-default text-neutral-text-secondary divide-y bg-white">
          {organizations.length === 0 ? (
            <tr>
              <td className="text-neutral-text-tertiary px-6 py-10 text-center" colSpan={4}>
                표시할 조직이 없습니다.
              </td>
            </tr>
          ) : (
            organizations.map((organization) => (
              <OrganizationRow key={organization.id} organization={organization} onEdit={onEdit} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OrganizationListTable;
