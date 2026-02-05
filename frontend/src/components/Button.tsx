import cn from '@/utils/cn';
import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  type?: 'primary' | 'secondary';
  variant?: 'fill' | 'outline';
  onClickHandler?: () => void;
  disabled?: boolean;
  htmlType?: 'button' | 'submit';
}

function Button({
  children,
  type = 'primary',
  onClickHandler,
  disabled = false,
  variant = 'fill',
  htmlType = 'button',
}: ButtonProps) {
  return (
    <button
      type={htmlType === 'submit' ? 'submit' : 'button'}
      className={cn(
        'flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-14 sm:text-16',
        type === 'primary' ? 'w-full' : 'px-3',
        variant === 'fill'
          ? 'bg-brand-surface-default disabled:bg-brand-surface-disabled text-white'
          : 'bg-white disabled:bg-neutral-surface-default border-neutral-border-default border',
      )}
      onClick={onClickHandler}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
