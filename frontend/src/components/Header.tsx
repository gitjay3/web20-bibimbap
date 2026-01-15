import { Link } from 'react-router';
import type { NavItem } from '@/Layout';
import { useAuth } from '@/store/AuthContext';
import LogoutIcon from '@/assets/icons/logout.svg?react';

interface HeaderProps {
  navItems: NavItem[];
}

function Header({ navItems }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="border-neutral-border-default sticky top-0 flex h-14 w-full items-center justify-between border-b bg-white/50 px-8 backdrop-blur">
      <div className="flex h-full items-center gap-5">
        <div className="flex gap-2">
          <img className="aspect-square h-6" src="/logo.webp" alt="로고" />
          <div className="font-extrabold">bookstcamp</div>
        </div>
        <nav className="text-12 flex gap-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-neutral-text-secondary hover:text-neutral-text-primary cursor-pointer transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {user && (
        <button
          type="button"
          onClick={logout}
          className="text-neutral-text-secondary hover:text-brand-500 hover:bg-neutral-surface-default flex h-8 w-8 items-center justify-center rounded-md transition-colors"
        >
          <LogoutIcon className="h-4 w-4" />
        </button>
      )}
    </header>
  );
}

export default Header;
