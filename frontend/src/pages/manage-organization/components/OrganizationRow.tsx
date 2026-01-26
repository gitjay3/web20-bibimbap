import { useNavigate } from 'react-router';
import Button from '@/components/Button';
import type { Organization } from '@/api/organization';

interface OrganizationRowProps {
  organization: Organization;
  onEdit: (organization: Organization) => void;
}

function OrganizationRow({ organization, onEdit }: OrganizationRowProps) {
  const navigate = useNavigate();

  const handleNavigateEvents = () => {
    navigate(`/orgs/${organization.id}`);
  };

  const handleNavigateCampers = () => {
    navigate(`/orgs/${organization.id}/campers`);
  };

  return (
    <tr className="transition-colors hover:bg-neutral-50">
      <td className="w-64 px-6 py-4">
        <button
          type="button"
          onClick={handleNavigateEvents}
          className="text-neutral-text-primary hover:text-brand-text-primary font-semibold"
          title="이벤트 관리로 이동"
        >
          {organization.name}
        </button>
      </td>

      <td className="w-24 px-6 py-4">
        <button
          type="button"
          onClick={handleNavigateCampers}
          className="text-neutral-text-primary hover:text-brand-text-primary font-semibold tabular-nums"
          title="캠퍼 관리로 이동"
        >
          {organization.camperCount ?? 0}
        </button>
      </td>

      <td className="w-24 px-6 py-4">
        <button
          type="button"
          onClick={handleNavigateEvents}
          className="text-neutral-text-primary hover:text-brand-text-primary font-semibold tabular-nums"
          title="이벤트 관리로 이동"
        >
          {organization.eventCount ?? 0}
        </button>
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="secondary" variant="outline" onClickHandler={() => onEdit(organization)}>
            수정
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default OrganizationRow;
