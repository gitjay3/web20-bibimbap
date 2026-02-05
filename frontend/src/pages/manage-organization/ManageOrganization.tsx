import { useEffect, useReducer, useState } from 'react';
import PageMeta from '@/components/PageMeta';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import PlusIcon from '@/assets/icons/plus.svg?react';
import { toast } from 'sonner';
import {
  getMyOrganizations,
  createOrganization,
  updateOrganization,
  type Organization,
} from '@/api/organization';
import OrganizationListTable from './components/OrganizationListTable';
import OrganizationFormModal from './components/OrganizationFormModal';

type ModalState = { type: 'closed' } | { type: 'form'; organization: Organization | null };

function modalReducer(_: ModalState, action: ModalState): ModalState {
  return action;
}

function ManageOrganization() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useReducer(modalReducer, { type: 'closed' });

  useEffect(() => {
    setIsLoading(true);

    (async () => {
      const data = await getMyOrganizations();
      setOrganizations(data);
      setIsLoading(false);
    })();
  }, []);

  const handleCreate = () => {
    setModal({ type: 'form', organization: null });
  };

  const handleEdit = (organization: Organization) => {
    setModal({ type: 'form', organization });
  };

  const handleCloseModal = () => {
    setModal({ type: 'closed' });
  };

  const handleSave = async (data: { name: string; slackBotToken?: string }) => {
    if (modal.type !== 'form') return;

    try {
      if (modal.organization) {
        const updated = await updateOrganization(modal.organization.id, data);

        setOrganizations((prev) => prev.map((org) => (org.id === updated.id ? updated : org)));

        toast.success('조직 정보가 수정되었습니다.');
      } else {
        const created = await createOrganization(data);

        setOrganizations((prev) => [...prev, created]);

        toast.success('조직이 성공적으로 추가되었습니다.');
      }
    } catch (error) {
      console.error(error);
      toast.error('조직 정보를 저장하는 중 오류가 발생했습니다.');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-14 w-1/2 animate-pulse rounded-xl bg-neutral-100" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-neutral-100" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  const isEmpty = organizations.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageMeta
        title="조직 관리"
        description="조직 정보를 수정하고 조직 구성 및 설정을 관리하세요."
      />
      <PageHeader
        title="조직 관리"
        description="등록된 조직 목록을 확인하고 관리합니다."
        action={
          <Button type="secondary" onClickHandler={handleCreate}>
            <PlusIcon className="h-4 w-4" />
            조직 추가
          </Button>
        }
      />

      {isEmpty ? (
        <div className="border-neutral-border-default bg-surface-white flex flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-14 text-center">
          <div className="text-neutral-text-primary text-18 font-bold">아직 조직이 없습니다</div>
          <div className="text-neutral-text-secondary text-14">
            조직을 추가하면 캠퍼/이벤트를 조직 단위로 관리할 수 있어요.
          </div>
          <div className="mt-2">
            <Button type="secondary" onClickHandler={handleCreate}>
              <PlusIcon className="h-4 w-4" />첫 조직 추가하기
            </Button>
          </div>
        </div>
      ) : (
        <OrganizationListTable organizations={organizations} onEdit={handleEdit} />
      )}

      <OrganizationFormModal
        isOpen={modal.type === 'form'}
        organization={modal.type === 'form' ? modal.organization : null}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </div>
  );
}

export default ManageOrganization;
