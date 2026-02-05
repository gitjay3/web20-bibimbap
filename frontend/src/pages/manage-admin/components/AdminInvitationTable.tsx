import type { AdminInvitation } from '@/api/admin';

interface AdminInvitationTableProps {
  invitations: AdminInvitation[];
  onRevoke: (id: string) => Promise<void>;
}

function AdminInvitationTable({ invitations, onRevoke }: AdminInvitationTableProps) {
  const pendingInvitations = invitations.filter((inv) => inv.status === 'PENDING');

  if (pendingInvitations.length === 0) {
    return null;
  }

  const handleRevoke = async (invitation: AdminInvitation) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `${invitation.githubUsername}님의 초대를 취소하시겠습니까?`
    );
    if (confirmed) {
      await onRevoke(invitation.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* 모바일: 카드 레이아웃 */}
      <div className="flex flex-col gap-3 sm:hidden">
        {pendingInvitations.map((invitation) => (
          <div
            key={invitation.id}
            className="border-neutral-border-default flex items-center gap-3 rounded-xl border bg-white px-4 py-3"
          >
            <div className="bg-neutral-surface-default flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium">
              {invitation.githubUsername.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-neutral-text-primary truncate text-14 font-medium">
                @{invitation.githubUsername}
              </p>
              <p className="text-neutral-text-tertiary text-13">
                {formatDateShort(invitation.invitedAt)} · {invitation.inviter.name || invitation.inviter.username}
              </p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => handleRevoke(invitation)}
                className="text-status-error hover:text-status-error/80 text-sm font-medium"
              >
                취소
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 데스크톱: 테이블 레이아웃 */}
      <div className="hidden w-full sm:block">
        <table className="w-full table-fixed text-left">
          <thead className="bg-surface-white border-neutral-border-default border-b">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">
                GitHub ID
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                초대일
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                초대자
              </th>
              <th scope="col" className="w-32 px-6 py-3 text-right font-medium">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-neutral-border-default text-neutral-text-secondary divide-y bg-white">
            {pendingInvitations.map((invitation) => (
              <tr key={invitation.id}>
                <td className="px-6 py-4">{invitation.githubUsername}</td>
                <td className="px-6 py-4">{formatDate(invitation.invitedAt)}</td>
                <td className="px-6 py-4">
                  {invitation.inviter.name || invitation.inviter.username}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleRevoke(invitation)}
                    className="text-status-error hover:text-status-error/80 text-sm font-medium"
                  >
                    초대 취소
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default AdminInvitationTable;
