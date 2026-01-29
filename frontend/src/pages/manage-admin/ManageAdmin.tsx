import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import PlusIcon from '@/assets/icons/plus.svg?react';
import type { AdminMember, AdminInvitation } from '@/api/admin';
import {
  getAdminMembers,
  getAdminInvitations,
  createAdminInvitation,
  revokeAdminInvitation,
  removeAdminMember,
} from '@/api/admin';
import AdminMemberTable from './components/AdminMemberTable';
import AdminInvitationTable from './components/AdminInvitationTable';
import InviteAdminModal from './components/InviteAdminModal';

function ManageAdmin() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [membersData, invitationsData] = await Promise.all([
        getAdminMembers(),
        getAdminInvitations(),
      ]);
      setMembers(membersData);
      setInvitations(invitationsData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async (githubUsername: string) => {
    const newInvitation = await createAdminInvitation(githubUsername);
    setInvitations((prev) => [...prev, newInvitation]);
    toast.success(`${githubUsername}님을 운영진으로 초대했습니다.`);
    setIsModalOpen(false);
  };

  const handleRevokeInvitation = async (id: string) => {
    await revokeAdminInvitation(id);
    setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    toast.success('초대가 취소되었습니다.');
  };

  const handleRemoveMember = async (id: string, username: string) => {
    await removeAdminMember(id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success(`${username}님의 운영진 권한이 해제되었습니다.`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="운영진 관리"
        description="운영진 목록을 관리하고 새로운 운영진을 초대합니다."
        action={
          <Button type="secondary" onClickHandler={() => setIsModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            운영진 초대
          </Button>
        }
      />

      <div className="flex flex-col gap-8">
        <section>
          <h3 className="mb-4 text-lg font-semibold">현재 운영진</h3>
          <AdminMemberTable members={members} onRemove={handleRemoveMember} />
        </section>

        {invitations.length > 0 && (
          <section>
            <h3 className="mb-4 text-lg font-semibold">대기 중인 초대</h3>
            <AdminInvitationTable
              invitations={invitations}
              onRevoke={handleRevokeInvitation}
            />
          </section>
        )}
      </div>

      <InviteAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}

export default ManageAdmin;
