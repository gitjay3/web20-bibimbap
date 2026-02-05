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

  if (!orgId || !organization) {
    // 조직 정보가 없으면 조직 선택 페이지로 이동
    return <Navigate to="/select-org" replace />;
  }

  return (
    <OrgProvider organization={organization}>
      <Outlet />
    </OrgProvider>
  );
}

export default OrgLayout;
