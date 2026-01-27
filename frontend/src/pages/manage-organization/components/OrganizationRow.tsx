import { useNavigate } from 'react-router';
import ModifyIcon from '@/assets/icons/pencil.svg?react';
import ChevronDownIcon from '@/assets/icons/chevron-down.svg?react';
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

  const chipBase =
    'group inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 min-w-[4.5rem] ' +
    'text-14 font-semibold tabular-nums ' +
    'border border-neutral-border-default bg-neutral-50 ' +
    'hover:bg-brand-100 hover:border-brand-border ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text-primary focus-visible:ring-offset-2 ' +
    'transition';

  const linkBadgeBase =
    'inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-border-default ' +
    'text-neutral-text-tertiary transition group-hover:border-brand-border group-hover:text-brand-text-primary';

  return (
    <tr className="group transition-colors hover:bg-neutral-50">
      {/* 조직명 */}
      <td className="w-64 px-6 py-4">
        <button
          type="button"
          onClick={handleNavigateEvents}
          className="text-neutral-text-primary hover:text-brand-text-primary inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
          title="이벤트 관리로 이동"
        >
          {organization.name}
          <span className={linkBadgeBase} aria-hidden="true" title="바로가기">
            <ChevronDownIcon className="h-3 w-3 -rotate-90" />
          </span>
        </button>
      </td>

      {/* 캠퍼 수 */}
      <td className="w-24 px-6 py-4">
        <button
          type="button"
          onClick={handleNavigateCampers}
          className={chipBase}
          title="캠퍼 관리로 이동"
        >
          <span className="text-neutral-text-primary">{organization.camperCount ?? 0}</span>
          <span className="text-neutral-text-tertiary text-12">명</span>
        </button>
      </td>

      {/* 이벤트 수 */}
      <td className="w-24 px-6 py-4">
        <button
          type="button"
          onClick={handleNavigateEvents}
          className={chipBase}
          title="이벤트 관리로 이동"
        >
          <span className="text-neutral-text-primary">{organization.eventCount ?? 0}</span>
          <span className="text-neutral-text-tertiary text-12">개</span>
        </button>
      </td>

      {/* 관리 */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-4">
          <ModifyIcon
            className="h-4 w-4 cursor-pointer text-neutral-text-secondary transition hover:text-brand-text-primary"
            onClick={() => onEdit(organization)}
            title="수정"
          />
        </div>
      </td>
    </tr>
  );
}

export default OrganizationRow;
