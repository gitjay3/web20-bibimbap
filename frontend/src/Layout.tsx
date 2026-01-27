import Header from '@/components/Header';
import { Outlet, useParams } from 'react-router';
import { useAuth } from '@/store/AuthContext';

export interface NavItem {
  label: string;
  to: string;
}

function Layout() {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useAuth();
  const role = user?.role ?? 'USER';

  const camperNav: NavItem[] = [
    { label: '이벤트 예약', to: `/orgs/${orgId}` },
    { label: '예약 관리', to: `/orgs/${orgId}/reservations` },
    { label: '마이페이지', to: `/orgs/${orgId}/me` },
  ];

  const adminNav: NavItem[] = [
    { label: '이벤트 관리', to: `/orgs/${orgId}` },
    { label: '조직 관리', to: `/orgs/${orgId}/organizations` },
    { label: '캠퍼 관리', to: `/orgs/${orgId}/campers` },
    { label: '템플릿 관리', to: `/orgs/${orgId}/templates` },
  ];

  const navItems = role === 'USER' ? camperNav : adminNav;

  return (
    <div className="min-h-screen">
      <Header navItems={navItems} />
      <main className="px-8 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
