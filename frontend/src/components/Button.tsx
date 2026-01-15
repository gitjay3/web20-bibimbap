import cn from '@/utils/cn';
import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  type?: 'primary' | 'secondary';
  onClickHandler?: () => void;
  disabled?: boolean;
}

function Button({ children, type = 'primary', onClickHandler, disabled = false }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'bg-brand-surface-default disabled:bg-brand-surface-disabled flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md text-white',
        type === 'primary' ? 'w-full' : 'px-3',
      )}
      onClick={onClickHandler}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
