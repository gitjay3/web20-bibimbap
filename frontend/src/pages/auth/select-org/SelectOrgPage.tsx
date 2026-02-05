import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
import PageMeta from '@/components/PageMeta';
import { getMyOrganizations, type Organization } from '@/api/organization';
import { useAuth } from '@/store/AuthContext';

function SelectOrgPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [myOrganizations, setMyOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    getMyOrganizations()
      .then(setMyOrganizations)
      .catch(() => setMyOrganizations([]))
      .finally(() => setIsLoading(false));
  }, []);

  const options = myOrganizations.map((org) => ({
    key: org.id,
    label: org.name,
  }));
  
  const handleStart = () => {
    if (selectedOrgId) {
      navigate(`/orgs/${selectedOrgId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
      <PageMeta
        title="조직 선택"
        description={isAdmin  ? "조직을 선택하여 이벤트 및 조직 관리 기능을 이용할 수 있습니다." : "참여 중인 조직을 선택하여 이벤트 예약 기능을 이용할 수 있습니다."}
      />
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? '관리할 기수를 선택해주세요' : '소속을 선택해주세요'}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? '운영할 기수를 선택해주세요.' : '현재 참여 중인 기수 및 과정을 선택해주세요.'}
          </p>
        </div>

        <div className="space-y-6">
          <Dropdown
            options={options}
            value={selectedOrgId}
            setValue={setSelectedOrgId}
            className="w-full"
          />

          <Button
            onClickHandler={handleStart}
            disabled={!selectedOrgId}
          >
            시작하기
          </Button>
        </div>

        <footer className="mt-20">
          <p className="text-sm text-gray-400">© 2026 bookstcamp. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}

export default SelectOrgPage;
