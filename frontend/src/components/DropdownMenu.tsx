import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import cn from '@/utils/cn';
import EllipsisIcon from '@/assets/icons/ellipsis-vertical.svg?react';

interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
  items: MenuItem[];
}

export default function DropdownMenu({ items }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="이벤트 관리"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-neutral-text-secondary hover:text-neutral-text-primary p-1"
      >
        <EllipsisIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="border-neutral-border-default absolute top-full right-0 z-10 mt-1 min-w-32 rounded-md border bg-white py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={(e) => {
                e.preventDefault(); // Link 클릭 방지
                e.stopPropagation();
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                'hover:bg-neutral-surface-default flex w-full items-center gap-2 px-4 py-2 text-left text-sm',
                item.variant === 'danger' && 'text-error-text-primary',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
