import type { AdminMember } from '@/api/admin';
import { useAuth } from '@/store/AuthContext';

interface AdminMemberTableProps {
  members: AdminMember[];
  onRemove: (id: string, username: string) => Promise<void>;
}

function AdminMemberTable({ members, onRemove }: AdminMemberTableProps) {
  const { user } = useAuth();

  const handleRemove = async (member: AdminMember) => {
    if (member.id === user?.id) {
      return;
    }

    if (members.length <= 1) {
      return;
    }

    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `${member.name || member.username}님의 운영진 권한을 해제하시겠습니까?`
    );
    if (confirmed) {
      await onRemove(member.id, member.name || member.username);
    }
  };

  const renderActionCell = (member: AdminMember) => {
    if (member.id === user?.id) {
      return <span className="text-neutral-text-tertiary text-sm">본인</span>;
    }
    if (members.length <= 1) {
      return <span className="text-neutral-text-tertiary text-sm">마지막 운영진</span>;
    }
    return (
      <button
        type="button"
        onClick={() => handleRemove(member)}
        className="text-status-error hover:text-status-error/80 text-sm font-medium"
      >
        권한 해제
      </button>
    );
  };

  return (
    <div className="w-full">
      <table className="w-full text-left">
        <thead className="bg-surface-white border-neutral-border-default border-b">
          <tr>
            <th scope="col" className="whitespace-nowrap px-6 py-3 font-medium">
              프로필
            </th>
            <th scope="col" className="px-6 py-3 font-medium">
              GitHub ID
            </th>
            <th scope="col" className="px-6 py-3 font-medium">
              이름
            </th>
            <th scope="col" className="w-32 px-6 py-3 text-right font-medium">
              관리
            </th>
          </tr>
        </thead>
        <tbody className="divide-neutral-border-default text-neutral-text-secondary divide-y bg-white">
          {members.map((member) => (
            <tr key={member.id}>
              <td className="px-6 py-4">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.username}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-neutral-surface-default flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">{member.username}</td>
              <td className="px-6 py-4">{member.name || '-'}</td>
              <td className="px-6 py-4 text-right">{renderActionCell(member)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminMemberTable;
