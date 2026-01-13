import type { NavItem } from '@/Layout';

interface HeaderProps {
  navItems: NavItem[];
}

function Header({ navItems }: HeaderProps) {
  return (
    <header className="border-neutral-border-default sticky top-0 h-14 w-full items-center justify-between border-b bg-white/50 px-8 backdrop-blur">
      <div className="flex h-full items-center gap-5">
        <div className="flex gap-2">
          <img className="aspect-square h-6" src="/logo.webp" alt="로고" />
          <div className="font-extrabold">bookstcamp</div>
        </div>
        <nav className="text-12 flex gap-4">
          {navItems.map((item) => (
            <div key={item.to} className="text-neutral-text-secondary">{item.label}</div>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Header;
