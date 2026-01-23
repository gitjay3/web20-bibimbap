import { Navigate, Outlet, useParams } from 'react-router';
import { useAuth } from '@/store/AuthContext';
import { useEffect, useState } from 'react';
import { getOrganization, type Organization } from '@/api/organization';
import { OrgProvider } from '@/store/OrgContext';

function OrgLayout() {
  const { orgId } = useParams<{ orgId: string }>();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isOrgLoading, setIsOrgLoading] = useState(true);

  useEffect(() => {
    if (orgId) {
      setIsOrgLoading(true);
      getOrganization(orgId)
        .then(setOrganization)
        .catch(() => setOrganization(null))
        .finally(() => setIsOrgLoading(false));
    }
  }, [orgId]);

  if (isAuthLoading || isOrgLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 사용자가 해당 조직에 속해 있는지 확인 (운영진은 모든 조직에 접근 가능)
  const isMember =
    user.role === 'ADMIN' ||
    user.organizations.some((orgEntry) => orgEntry.organization.id === orgId);

  if (!orgId || !isMember || !organization) {
    // 권한이 없거나 orgId가 없거나 조직 정보가 없으면 조직 선택 페이지로 이동
    return <Navigate to="/select-org" replace />;
  }

  return (
    <OrgProvider organization={organization}>
      <Outlet />
    </OrgProvider>
  );
}

export default OrgLayout;
