import Header from '@/components/Header';
import { Outlet } from 'react-router';

export interface NavItem {
  label: string;
  to: string;
}

function Layout() {
  // TODO: 로그인 된 유저의 role을 가져오는 코드 작성
  const role = 'CAMPER';

  const camperNav: NavItem[] = [
    { label: '이벤트 예약', to: '/' },
    { label: '마이페이지', to: '/me' },
  ];

  const adminNav: NavItem[] = [
    { label: '이벤트 관리', to: '/admin' },
    { label: '캠퍼 관리', to: '/admin/campers' },
    { label: '템플릿 관리', to: '/admin/templates' },
  ];

  const navItems = role === 'CAMPER' ? camperNav : adminNav;

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
