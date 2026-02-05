import { useNavigate } from 'react-router';
import ModifyIcon from '@/assets/icons/pencil.svg?react';
import ChevronDownIcon from '@/assets/icons/chevron-down.svg?react';
import type { Organization } from '@/api/organization';
import OrganizationRow from './OrganizationRow';

interface OrganizationListTableProps {
  organizations: Organization[];
  onEdit: (organization: Organization) => void;
}

function OrganizationListTable({ organizations, onEdit }: OrganizationListTableProps) {
  const navigate = useNavigate();

  if (organizations.length === 0) {
    return (
      <div className="border-neutral-border-default text-neutral-text-tertiary rounded-2xl border bg-white px-6 py-10 text-center">
        표시할 조직이 없습니다.
      </div>
    );
  }

  return (
    <>
      {/* 모바일: 카드 레이아웃 */}
      <div className="flex flex-col gap-3 sm:hidden">
        {organizations.map((organization) => (
          <div
            key={organization.id}
            className="border-neutral-border-default rounded-xl border bg-white p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(`/orgs/${organization.id}`)}
                className="text-neutral-text-primary hover:text-brand-text-primary flex items-center gap-1 text-16 font-semibold"
              >
                {organization.name}
                <ChevronDownIcon className="h-4 w-4 -rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(organization)}
                className="text-neutral-text-secondary hover:text-brand-text-primary p-1"
              >
                <ModifyIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(`/orgs/${organization.id}/campers`)}
                className="border-neutral-border-default hover:border-brand-border hover:bg-brand-50 flex items-center gap-1 rounded-full border bg-neutral-50 px-3 py-1.5 text-13"
              >
                <span className="text-neutral-text-primary font-medium">{organization.camperCount ?? 0}</span>
                <span className="text-neutral-text-tertiary">명</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(`/orgs/${organization.id}`)}
                className="border-neutral-border-default hover:border-brand-border hover:bg-brand-50 flex items-center gap-1 rounded-full border bg-neutral-50 px-3 py-1.5 text-13"
              >
                <span className="text-neutral-text-primary font-medium">{organization.eventCount ?? 0}</span>
                <span className="text-neutral-text-tertiary">개 이벤트</span>
              </button>
              {organization.slackWorkspaceId && (
                <span className="text-neutral-text-secondary rounded-full bg-neutral-50 px-3 py-1.5 text-13">
                  Slack 연동
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 데스크톱: 테이블 레이아웃 */}
      <div className="border-neutral-border-default hidden overflow-hidden rounded-2xl border bg-white sm:block">
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
              <th scope="col" className="w-60 px-6 py-3 font-medium">
                슬랙 워크스페이스
              </th>
              <th scope="col" className="px-6 py-3 text-right font-medium">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-neutral-border-default text-neutral-text-secondary divide-y bg-white">
            {organizations.map((organization) => (
              <OrganizationRow key={organization.id} organization={organization} onEdit={onEdit} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default OrganizationListTable;
