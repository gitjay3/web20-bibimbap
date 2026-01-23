import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
import { getMyOrganizations, type Organization } from '@/api/organization';

function SelectOrgPage() {
  const navigate = useNavigate();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [myOrganizations, setMyOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">소속을 선택해주세요</h1>
          <p className="text-gray-600">현재 참여 중인 기수 및 과정을 선택해주세요.</p>
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
    </div>
  );
}

export default SelectOrgPage;
