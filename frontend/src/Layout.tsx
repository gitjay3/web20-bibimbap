import Header from '@/components/Header';
import { Outlet } from 'react-router';
import { useAuth } from '@/store/AuthContext';

export interface NavItem {
  label: string;
  to: string;
}

function Layout() {
  const { user } = useAuth();
  const role = user?.role ?? 'USER';

  const camperNav: NavItem[] = [
    { label: '이벤트 예약', to: '/' },
    { label: '마이페이지', to: '/me' },
  ];

  const adminNav: NavItem[] = [
    { label: '이벤트 관리', to: '/' },
    { label: '캠퍼 관리', to: '/campers' },
    { label: '템플릿 관리', to: '/templates' },
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
